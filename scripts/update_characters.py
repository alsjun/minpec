"""로스트아크 API에서 캐릭터 전투력/아이템 레벨을 받아 Supabase에 반영합니다.

GitHub Actions에서 매일 새벽에 실행되고, 로컬에서도 .env를 읽어 실행할 수 있습니다.

    python scripts/update_characters.py

필요한 환경변수: LOSTARK_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

LOSTARK_API = "https://developer-lostark.game.onstove.com"
LOPEC_CHARACTER_API = "https://lopec.kr/character/specPoint"
# 로아 API는 분당 100회 제한이 있어 캐릭터 사이에 짧게 쉬어 줍니다.
REQUEST_INTERVAL_SEC = 0.7
# 로펙은 공식 공개 API가 아니라 캐릭터 페이지 HTML을 읽으므로 더 보수적으로 요청합니다.
LOPEC_REQUEST_INTERVAL_SEC = 2.0
LOPEC_HEADERS = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "user-agent": "loa-party updater",
}


def load_env_file() -> None:
    """로컬 실행용 .env 파일을 읽습니다. 이미 설정된 환경변수는 건드리지 않습니다."""
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        print(f"환경변수 {name}이(가) 비어 있습니다. .env 또는 GitHub Secrets를 확인해 주세요.")
        sys.exit(1)
    return value


def parse_number(raw: str | None) -> float | None:
    """API가 '1,780.83' 같은 문자열을 주므로 숫자로 바꿉니다."""
    if not raw:
        return None
    try:
        return float(str(raw).replace(",", ""))
    except ValueError:
        return None


def round_number(value: float | None, digits: int = 2) -> float | None:
    if value is None:
        return None
    return round(value, digits)


def find_json_number(text: str, key: str) -> float | None:
    match = re.search(rf'"{re.escape(key)}":(-?\d+(?:\.\d+)?)', text)
    if not match:
        return None
    return parse_number(match.group(1))


def extract_json_array(text: str, marker: str) -> list[Any] | None:
    start = text.find(marker)
    if start < 0:
        return None

    array_start = text.find("[", start)
    if array_start < 0:
        return None

    depth = 0
    in_string = False
    escaped = False
    for idx in range(array_start, len(text)):
        ch = text[idx]
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
            continue

        if ch == '"':
            in_string = True
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                try:
                    data = json.loads(text[array_start : idx + 1])
                except json.JSONDecodeError:
                    return None
                return data if isinstance(data, list) else None
    return None


# 아크그리드 젬 옵션의 역할 구분. 로펙은 실제 효율 기준이라
# 캐릭터 역할과 맞지 않는 옵션은 효율 합계에서 빼야 합니다.
SUPPORT_GEM_OPTIONS = {"낙인력", "아군 공격 강화", "아군 피해 강화"}
SUPPORT_CLASSES = {"바드", "홀리나이트", "도화가", "발키리"}


def is_support_character(ch: dict) -> bool:
    """프론트 roles.ts와 같은 기준: 수동 지정(role)이 있으면 우선, 없으면 직업으로 추정."""
    role = ch.get("role")
    if role == "support":
        return True
    if role == "dealer":
        return False
    return ch.get("clazz") in SUPPORT_CLASSES


def gem_total_for_role(gem_effects: list[dict[str, Any]], support: bool) -> float | None:
    """역할에 맞는 옵션만 합산합니다. 서폿은 서폿 옵션만, 딜러는 그 외 옵션만 계산합니다."""
    relevant = [
        item["effect"]
        for item in gem_effects
        if (item["name"] in SUPPORT_GEM_OPTIONS) == support
    ]
    return sum(relevant) if relevant else None


def parse_lopec_html(html: str) -> dict[str, Any] | None:
    # Next.js 초기 데이터가 JSON 문자열로 한 번 더 감싸져 있어 escape를 풀고 필요한 값만 읽습니다.
    text = html.replace('\\"', '"')
    current_score = find_json_number(text, "specPoint")
    best_score = find_json_number(text, "dbScore")
    median = find_json_number(text, "nowMedian")
    gem_median = find_json_number(text, "arkgridGemMedian")

    gem_effects: list[dict[str, Any]] = []
    for item in extract_json_array(text, '"gemEffects"') or []:
        if not isinstance(item, dict):
            continue
        name = item.get("name")
        level = item.get("level")
        effect = item.get("effect")
        if not isinstance(name, str) or not isinstance(level, int) or not isinstance(effect, (int, float)):
            continue
        gem_effects.append({"name": name, "level": level, "effect": round(float(effect), 2)})

    gem_total = sum(item["effect"] for item in gem_effects) if gem_effects else None
    if current_score is None and best_score is None and gem_total is None:
        return None

    return {
        "lopec": {
            "currentScore": round_number(current_score),
            "bestScore": round_number(best_score),
            "median": round_number(median),
            "delta": round_number(current_score - median)
            if current_score is not None and median is not None
            else None,
        },
        "gemEfficiency": {
            "total": round_number(gem_total),
            "median": round_number(gem_median),
            "effects": gem_effects,
        },
    }


def fetch_lopec(session: requests.Session, name: str) -> dict[str, Any] | None:
    # 로펙은 외부 사이트라 느리거나 막힐 수 있습니다.
    # 여기서 실패해도 전투력 갱신은 계속되어야 하므로 예외를 밖으로 던지지 않습니다.
    url = f"{LOPEC_CHARACTER_API}/{urllib.parse.quote(name)}"
    for attempt in range(2):
        try:
            resp = session.get(url, headers=LOPEC_HEADERS, timeout=20)
        except requests.RequestException as e:
            print(f"  [로펙 실패] {name}: {type(e).__name__}")
            return None
        if resp.status_code == 429 and attempt == 0:
            print(f"  [로펙 대기] {name}: 요청 제한으로 잠시 뒤 재시도")
            time.sleep(8)
            continue
        if resp.status_code != 200:
            print(f"  [로펙 실패] {name}: HTTP {resp.status_code}")
            return None

        parsed = parse_lopec_html(resp.text)
        if parsed is None:
            print(f"  [로펙 실패] {name}: 로펙 점수/젬 효율을 찾지 못함")
        return parsed
    return None


def fetch_profile(session: requests.Session, api_key: str, name: str) -> dict | None:
    url = f"{LOSTARK_API}/armories/characters/{urllib.parse.quote(name)}/profiles"
    try:
        resp = session.get(
            url,
            headers={"accept": "application/json", "authorization": f"bearer {api_key}"},
            timeout=15,
        )
    except requests.RequestException as e:
        # 한 캐릭터의 통신 실패로 전체 갱신이 중단되지 않도록 실패 처리만 하고 넘어갑니다.
        print(f"  [실패] {name}: {type(e).__name__}")
        return None
    if resp.status_code != 200:
        print(f"  [실패] {name}: HTTP {resp.status_code}")
        return None
    data = resp.json()
    # 존재하지 않는 캐릭터는 200에 null 본문이 옵니다.
    if not isinstance(data, dict):
        print(f"  [실패] {name}: 캐릭터를 찾을 수 없음(개명/삭제 여부 확인 필요)")
        return None
    return data


def supabase_headers(service_key: str) -> dict:
    return {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }


def main() -> None:
    # --lopec-only: 로아 API는 건너뛰고 로펙 점수·젬 효율만 빠르게 갱신합니다.
    lopec_only = "--lopec-only" in sys.argv
    load_env_file()
    api_key = "" if lopec_only else require_env("LOSTARK_API_KEY")
    # REST 주소(.../rest/v1)를 넣어도 동작하도록 base 주소로 정리합니다.
    sb_url = re.sub(r"/rest/v1/?$", "", require_env("SUPABASE_URL").strip().rstrip("/"))
    sb_key = require_env("SUPABASE_SERVICE_ROLE_KEY")

    headers = supabase_headers(sb_key)
    resp = requests.get(
        f"{sb_url}/rest/v1/sections",
        params={"key": "eq.characters", "select": "data"},
        headers=headers,
        timeout=15,
    )
    resp.raise_for_status()
    rows = resp.json()
    if not rows:
        print("sections 테이블에 characters 데이터가 없습니다. 웹앱을 한 번 열어 초기화해 주세요.")
        sys.exit(1)

    characters: list[dict] = rows[0]["data"]
    previous = json.loads(json.dumps(characters))
    now = datetime.now(timezone.utc).isoformat()

    session = requests.Session()
    updated = failed = 0
    for ch in characters:
        source_updated = False
        if not lopec_only:
            profile = fetch_profile(session, api_key, ch["name"])
            time.sleep(REQUEST_INTERVAL_SEC)
            if profile is None:
                failed += 1
            else:
                ch["clazz"] = profile.get("CharacterClassName") or ch.get("clazz")
                ch["itemLevel"] = parse_number(profile.get("ItemAvgLevel")) or ch.get("itemLevel")
                ch["combatPower"] = parse_number(profile.get("CombatPower")) or ch.get("combatPower")
                ch["updatedAt"] = now
                source_updated = True

        lopec = fetch_lopec(session, ch["name"])
        time.sleep(LOPEC_REQUEST_INTERVAL_SEC)
        if lopec is None:
            ch["lopecError"] = "로펙 조회 실패"
        else:
            ch["lopec"] = lopec["lopec"]
            gem = dict(lopec["gemEfficiency"])
            # 젬 효율 합계는 캐릭터 역할에 맞는 옵션만 계산합니다.
            # 딜러에게 낙인력 같은 서폿 옵션까지 더하면 로펙 표시값보다 커집니다.
            total = gem_total_for_role(gem.get("effects", []), is_support_character(ch))
            gem["total"] = round_number(total)
            ch["gemEfficiency"] = gem
            ch["lopecUpdatedAt"] = now
            ch["lopecError"] = None
            source_updated = True

        if not source_updated:
            continue
        updated += 1
        print(
            f"  [갱신] {ch['name']}: 템렙 {ch['itemLevel']}, 전투력 {ch['combatPower']}, "
            f"로펙 현재 {ch.get('lopec', {}).get('currentScore')}, "
            f"최고 {ch.get('lopec', {}).get('bestScore')}, "
            f"젬 {ch.get('gemEfficiency', {}).get('total')}%"
        )

    if updated == 0:
        print("갱신된 캐릭터가 없어 저장을 건너뜁니다.")
        sys.exit(1)

    # 갱신 전 상태를 이력으로 남긴 뒤 저장합니다. 웹앱의 되돌리기와 같은 방식입니다.
    hist = requests.post(
        f"{sb_url}/rest/v1/sections_history",
        headers=headers,
        json={"section": "characters", "data": previous},
        timeout=15,
    )
    hist.raise_for_status()

    save = requests.patch(
        f"{sb_url}/rest/v1/sections",
        params={"key": "eq.characters"},
        headers=headers,
        json={"data": characters, "updated_at": now},
        timeout=15,
    )
    save.raise_for_status()
    print(f"완료: {updated}개 갱신, {failed}개 실패")


if __name__ == "__main__":
    main()
