"""Supabase sections 테이블의 현재 데이터를 backups/ 폴더에 JSON으로 내려받습니다.
되돌리기 이력(sections_history)은 백업에 포함하지 않습니다.

GitHub Actions가 매일 실행해 저장소에 커밋하므로, 데이터가 크게 망가져도
git 이력에서 원하는 날짜의 상태를 복구할 수 있습니다.

    python scripts/backup.py

필요한 환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
from update_characters import load_env_file, require_env, supabase_headers  # noqa: E402


def main() -> None:
    load_env_file()
    # REST 주소(.../rest/v1)를 넣어도 동작하도록 base 주소로 정리합니다.
    sb_url = re.sub(r"/rest/v1/?$", "", require_env("SUPABASE_URL").strip().rstrip("/"))
    sb_key = require_env("SUPABASE_SERVICE_ROLE_KEY")

    resp = requests.get(
        f"{sb_url}/rest/v1/sections",
        params={"select": "key,data,updated_at"},
        headers=supabase_headers(sb_key),
        timeout=15,
    )
    resp.raise_for_status()
    rows = resp.json()
    if not rows:
        print("백업할 데이터가 없습니다.")
        sys.exit(1)

    backup_dir = Path(__file__).resolve().parent.parent / "backups"
    backup_dir.mkdir(exist_ok=True)
    # 백업이 KST 새벽에 돌기 때문에 파일명도 KST 날짜를 씁니다. UTC를 쓰면 전날 날짜가 됩니다.
    kst = timezone(timedelta(hours=9))
    today = datetime.now(kst).strftime("%Y-%m-%d")
    out_path = backup_dir / f"{today}.json"
    out_path.write_text(
        json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    print(f"백업 완료: {out_path} ({len(rows)}개 섹션)")


if __name__ == "__main__":
    main()
