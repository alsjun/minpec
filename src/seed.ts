// 이 파일은 구글 시트에서 옮겨 온 초기 데이터입니다.
// Supabase가 비어 있을 때 최초 한 번 자동으로 올라가고, 이후에는 DB 값이 기준이 됩니다.
// 골드표는 정적 데이터라 여기서 직접 수정하면 됩니다.
import type { Character, Raid, Checks, Assignments, GoldRow, RaidGoldRow, MemberColors, Sections } from './types'

export const SEED_CHARACTERS: Character[] = [
  {
    "code": "건1",
    "member": "건아",
    "name": "아마도시커먼",
    "account": "건아",
    "clazz": "건슬링어",
    "combatPower": 7037.0,
    "itemLevel": 1780.83
  },
  {
    "code": "건2",
    "member": "건아",
    "name": "기무유느기",
    "account": "건아",
    "clazz": "데빌헌터",
    "combatPower": 4504.0,
    "itemLevel": 1751.67
  },
  {
    "code": "건3",
    "member": "건아",
    "name": "0뀬땬쨩",
    "account": "건아",
    "clazz": "기상술사",
    "combatPower": 4521.0,
    "itemLevel": 1750.83
  },
  {
    "code": "건4",
    "member": "건아",
    "name": "아포가토시커먼",
    "account": "건아",
    "clazz": "환수사",
    "combatPower": 3486.0,
    "itemLevel": 1730.83
  },
  {
    "code": "건5",
    "member": "건아",
    "name": "아무래도시커먼",
    "account": "건아",
    "clazz": "가디언나이트",
    "combatPower": 3405.0,
    "itemLevel": 1737.5
  },
  {
    "code": "건6",
    "member": "건아",
    "name": "+그냥시커먼",
    "account": "건아",
    "clazz": "도화가",
    "combatPower": 3020.0,
    "itemLevel": 1730.0
  },
  {
    "code": "민1",
    "member": "민준",
    "name": "0군단장",
    "account": "민준",
    "clazz": "기상술사",
    "combatPower": 7334.0,
    "itemLevel": 1780.0
  },
  {
    "code": "민2",
    "member": "민준",
    "name": "F4ide",
    "account": "민준",
    "clazz": "블레이드",
    "combatPower": 4211.0,
    "itemLevel": 1756.67
  },
  {
    "code": "민3",
    "member": "민준",
    "name": "4XOy",
    "account": "민준",
    "clazz": "차원술사",
    "combatPower": 4324.0,
    "itemLevel": 1750.83
  },
  {
    "code": "영1",
    "member": "영찬",
    "name": "+자몽초",
    "account": "영찬",
    "clazz": "발키리",
    "combatPower": 5734.0,
    "itemLevel": 1775.0
  },
  {
    "code": "영2",
    "member": "영찬",
    "name": "+유자초",
    "account": "영찬",
    "clazz": "발키리",
    "combatPower": 3912.0,
    "itemLevel": 1750.0
  },
  {
    "code": "영3",
    "member": "영찬",
    "name": "자몽맛크로앙쥬",
    "account": "영찬",
    "clazz": "슬레이어",
    "combatPower": 3193.0,
    "itemLevel": 1721.67
  },
  {
    "code": "예1",
    "member": "예진",
    "name": "+가치",
    "account": "예진",
    "clazz": "바드",
    "combatPower": 5835.0,
    "itemLevel": 1777.5
  },
  {
    "code": "예2",
    "member": "예진",
    "name": "도토리인형",
    "account": "예진",
    "clazz": "인파이터",
    "combatPower": 5084.0,
    "itemLevel": 1772.5
  },
  {
    "code": "예3",
    "member": "예진",
    "name": "민주원",
    "account": "예진",
    "clazz": "소서리스",
    "combatPower": 4452.0,
    "itemLevel": 1755.83
  },
  {
    "code": "예4",
    "member": "예진",
    "name": "+도토리정원",
    "account": "예진",
    "clazz": "발키리",
    "combatPower": 4284.0,
    "itemLevel": 1750.0
  },
  {
    "code": "예5",
    "member": "예진",
    "name": "때굴때굴도토리",
    "account": "예진",
    "clazz": "워로드",
    "combatPower": 3249.0,
    "itemLevel": 1735.0
  },
  {
    "code": "예6",
    "member": "예진",
    "name": "+타닥도토리",
    "account": "예진",
    "clazz": "홀리나이트",
    "combatPower": 3170.0,
    "itemLevel": 1732.67
  },
  {
    "code": "예7",
    "member": "예진2",
    "name": "밤옴뇸뇽",
    "account": "예진",
    "clazz": "기상술사",
    "combatPower": 3249.0,
    "itemLevel": 1733.33
  },
  {
    "code": "예8",
    "member": "예진2",
    "name": "감자옴뇸뇽",
    "account": "예진",
    "clazz": "슬레이어",
    "combatPower": 3213.0,
    "itemLevel": 1736.67
  },
  {
    "code": "예9",
    "member": "예진2",
    "name": "+옥수수옴뇸뇽",
    "account": "예진",
    "clazz": "도화가",
    "combatPower": 2422.0,
    "itemLevel": 1720.83
  },
  {
    "code": "용1",
    "member": "용주",
    "name": "나우보리",
    "account": "용주",
    "clazz": "브레이커",
    "combatPower": 6288.0,
    "itemLevel": 1777.5
  },
  {
    "code": "용2",
    "member": "용주",
    "name": "이솔보리",
    "account": "용주",
    "clazz": "인파이터",
    "combatPower": 4290.0,
    "itemLevel": 1752.5
  },
  {
    "code": "용3",
    "member": "용주",
    "name": "이솔화련",
    "account": "용주",
    "clazz": "가디언나이트",
    "combatPower": 3977.0,
    "itemLevel": 1750.83
  },
  {
    "code": "용4",
    "member": "용주",
    "name": "장봉삼",
    "account": "용주",
    "clazz": "디스트로이어",
    "combatPower": 3413.0,
    "itemLevel": 1730.0
  },
  {
    "code": "용5",
    "member": "용주",
    "name": "당연아",
    "account": "용주",
    "role": "dealer",
    "clazz": "발키리",
    "combatPower": 3287.0,
    "itemLevel": 1730.83
  },
  {
    "code": "용6",
    "member": "용주",
    "name": "이솔나린",
    "account": "용주",
    "clazz": "환수사",
    "combatPower": 3185.0,
    "itemLevel": 1730.0
  },
  {
    "code": "원1",
    "member": "원규",
    "name": "레에멜",
    "account": "원규",
    "clazz": "창술사",
    "combatPower": 7557.0,
    "itemLevel": 1794.17
  },
  {
    "code": "원2",
    "member": "원규",
    "name": "그때의워붕이",
    "account": "원규",
    "clazz": "워로드",
    "combatPower": 5091.0,
    "itemLevel": 1770.0
  },
  {
    "code": "원3",
    "member": "원규",
    "name": "화현석",
    "account": "원규",
    "clazz": "가디언나이트",
    "combatPower": 3847.0,
    "itemLevel": 1735.83
  },
  {
    "code": "원4",
    "member": "원규",
    "name": "작서현",
    "account": "원규",
    "clazz": "블레이드",
    "combatPower": 3835.0,
    "itemLevel": 1739.17
  },
  {
    "code": "원5",
    "member": "원규",
    "name": "주겜탈",
    "account": "원규",
    "clazz": "버서커",
    "combatPower": 3452.0,
    "itemLevel": 1735.0
  },
  {
    "code": "원6",
    "member": "원규",
    "name": "나작현",
    "account": "원규",
    "clazz": "서머너",
    "combatPower": 3428.0,
    "itemLevel": 1731.67
  },
  {
    "code": "유1",
    "member": "유한",
    "name": "핑크보라돼지",
    "account": "유한",
    "clazz": "배틀마스터",
    "combatPower": 7007.0,
    "itemLevel": 1785.83
  },
  {
    "code": "유2",
    "member": "유한",
    "name": "히힛산군발싸",
    "account": "유한",
    "clazz": "스트라이커",
    "combatPower": 4741.0,
    "itemLevel": 1760.0
  },
  {
    "code": "유3",
    "member": "유한",
    "name": "히힛도심발싸",
    "account": "유한",
    "clazz": "아르카나",
    "combatPower": 4655.0,
    "itemLevel": 1754.17
  },
  {
    "code": "유4",
    "member": "유한",
    "name": "히솔발",
    "account": "유한",
    "clazz": "기상술사",
    "combatPower": 3904.0,
    "itemLevel": 1730.0
  },
  {
    "code": "유5",
    "member": "유한",
    "name": "히힛내공발싸",
    "account": "유한",
    "clazz": "기공사",
    "combatPower": 3687.0,
    "itemLevel": 1731.67
  },
  {
    "code": "유6",
    "member": "유한",
    "name": "히힛용숨발싸",
    "account": "유한",
    "clazz": "가디언나이트",
    "combatPower": 3281.0,
    "itemLevel": 1730.83
  },
  {
    "code": "은1",
    "member": "은수",
    "name": "타니쟈",
    "account": "은수",
    "clazz": "가디언나이트",
    "combatPower": 4059.0,
    "itemLevel": 1750.83
  },
  {
    "code": "은2",
    "member": "은수",
    "name": "레린카",
    "account": "은수",
    "clazz": "서머너",
    "combatPower": 2710.0,
    "itemLevel": 1720.0
  }
]

export const SEED_RAIDS: Raid[] = [
  {
    "id": "나르딘",
    "name": "벨가르딘 나이트메어",
    "partySize": 4,
    "active": true
  },
  {
    "id": "하르딘",
    "name": "벨가르딘 하드",
    "partySize": 4,
    "active": true
  },
  {
    "id": "노르딘",
    "name": "벨가르딘 노말",
    "partySize": 4,
    "active": true
  },
  {
    "id": "종막",
    "name": "카제로스 종막",
    "partySize": 8,
    "active": true
  },
  {
    "id": "4막",
    "name": "카제로스 4막",
    "partySize": 8,
    "active": true
  },
  {
    "id": "나르카",
    "name": "세르카 나이트메어",
    "partySize": 4,
    "active": true
  },
  {
    "id": "하르카",
    "name": "세르카 하드",
    "partySize": 4,
    "active": true
  },
  {
    "id": "3성당",
    "name": "성심당 3단계",
    "partySize": 4,
    "active": true
  },
  {
    "id": "2성당",
    "name": "성심당 2단계",
    "partySize": 4,
    "active": true
  }
]

export const SEED_CHECKS: Checks = {
  "아마도시커먼": {
    "나르딘": false,
    "하르딘": true,
    "노르딘": false,
    "종막": true,
    "4막": false,
    "나르카": true,
    "하르카": false,
    "3성당": true,
    "2성당": false
  },
  "기무유느기": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": true,
    "종막": true,
    "4막": false,
    "나르카": true,
    "하르카": false,
    "3성당": true,
    "2성당": false
  },
  "0뀬땬쨩": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": true,
    "종막": true,
    "4막": false,
    "나르카": false,
    "하르카": false,
    "3성당": false,
    "2성당": false
  },
  "아포가토시커먼": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": true,
    "4막": true,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": true
  },
  "아무래도시커먼": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": true,
    "4막": true,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": true
  },
  "+그냥시커먼": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": true,
    "4막": true,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": true
  },
  "0군단장": {
    "나르딘": false,
    "하르딘": true,
    "노르딘": false,
    "종막": true,
    "4막": false,
    "나르카": true,
    "하르카": false,
    "3성당": true,
    "2성당": false
  },
  "F4ide": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": true,
    "종막": true,
    "4막": false,
    "나르카": true,
    "하르카": false,
    "3성당": false,
    "2성당": false
  },
  "4XOy": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": true,
    "종막": true,
    "4막": false,
    "나르카": true,
    "하르카": false,
    "3성당": true,
    "2성당": false
  },
  "+자몽초": {
    "나르딘": false,
    "하르딘": true,
    "노르딘": false,
    "종막": true,
    "4막": false,
    "나르카": true,
    "하르카": false,
    "3성당": false,
    "2성당": false
  },
  "+유자초": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": false,
    "4막": false,
    "나르카": false,
    "하르카": false,
    "3성당": false,
    "2성당": false
  },
  "자몽맛크로앙쥬": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": false,
    "4막": false,
    "나르카": false,
    "하르카": false,
    "3성당": false,
    "2성당": false
  },
  "+가치": {
    "나르딘": false,
    "하르딘": true,
    "노르딘": false,
    "종막": true,
    "4막": false,
    "나르카": true,
    "하르카": false,
    "3성당": true,
    "2성당": false
  },
  "도토리인형": {
    "나르딘": false,
    "하르딘": true,
    "노르딘": false,
    "종막": false,
    "4막": false,
    "나르카": true,
    "하르카": false,
    "3성당": false,
    "2성당": false
  },
  "민주원": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": true,
    "종막": true,
    "4막": false,
    "나르카": true,
    "하르카": false,
    "3성당": false,
    "2성당": false
  },
  "+도토리정원": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": true,
    "종막": false,
    "4막": false,
    "나르카": true,
    "하르카": false,
    "3성당": false,
    "2성당": false
  },
  "때굴때굴도토리": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": true,
    "4막": true,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": false
  },
  "+타닥도토리": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": true,
    "4막": true,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": false
  },
  "밤옴뇸뇽": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": true,
    "4막": true,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": false
  },
  "감자옴뇸뇽": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": true,
    "4막": true,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": false
  },
  "+옥수수옴뇸뇽": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": false,
    "4막": true,
    "나르카": false,
    "하르카": false,
    "3성당": false,
    "2성당": false
  },
  "나우보리": {
    "나르딘": false,
    "하르딘": true,
    "노르딘": false,
    "종막": true,
    "4막": false,
    "나르카": true,
    "하르카": false,
    "3성당": true,
    "2성당": false
  },
  "이솔보리": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": true,
    "종막": true,
    "4막": false,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": false
  },
  "이솔화련": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": true,
    "종막": true,
    "4막": false,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": false
  },
  "장봉삼": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": true,
    "4막": true,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": false
  },
  "당연아": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": true,
    "4막": true,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": false
  },
  "이솔나린": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": true,
    "4막": true,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": false
  },
  "레에멜": {
    "나르딘": true,
    "하르딘": false,
    "노르딘": false,
    "종막": false,
    "4막": false,
    "나르카": false,
    "하르카": false,
    "3성당": false,
    "2성당": false
  },
  "그때의워붕이": {
    "나르딘": false,
    "하르딘": true,
    "노르딘": false,
    "종막": false,
    "4막": false,
    "나르카": false,
    "하르카": false,
    "3성당": false,
    "2성당": false
  },
  "화현석": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": false,
    "4막": false,
    "나르카": false,
    "하르카": false,
    "3성당": false,
    "2성당": false
  },
  "작서현": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": false,
    "4막": false,
    "나르카": false,
    "하르카": false,
    "3성당": false,
    "2성당": false
  },
  "주겜탈": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": false,
    "4막": false,
    "나르카": false,
    "하르카": false,
    "3성당": false,
    "2성당": false
  },
  "나작현": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": false,
    "4막": false,
    "나르카": false,
    "하르카": false,
    "3성당": false,
    "2성당": false
  },
  "핑크보라돼지": {
    "나르딘": false,
    "하르딘": true,
    "노르딘": false,
    "종막": true,
    "4막": false,
    "나르카": true,
    "하르카": false,
    "3성당": true,
    "2성당": false
  },
  "히힛산군발싸": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": true,
    "종막": false,
    "4막": false,
    "나르카": true,
    "하르카": false,
    "3성당": true,
    "2성당": false
  },
  "히힛도심발싸": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": true,
    "종막": false,
    "4막": false,
    "나르카": true,
    "하르카": false,
    "3성당": true,
    "2성당": false
  },
  "히솔발": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": true,
    "4막": true,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": false
  },
  "히힛내공발싸": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": true,
    "4막": true,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": false
  },
  "히힛용숨발싸": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": true,
    "4막": true,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": false
  },
  "타니쟈": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": true,
    "종막": true,
    "4막": false,
    "나르카": false,
    "하르카": true,
    "3성당": false,
    "2성당": false
  },
  "레린카": {
    "나르딘": false,
    "하르딘": false,
    "노르딘": false,
    "종막": false,
    "4막": true,
    "나르카": false,
    "하르카": false,
    "3성당": false,
    "2성당": false
  }
}

export const SEED_ASSIGNMENTS: Assignments = {
  "나르딘": [],
  "하르딘": [
    {
      "slots": [
        "+자몽초",
        "+가치",
        "0군단장",
        "아마도시커먼",
        "핑크보라돼지",
        "나우보리",
        "그때의워붕이"
      ],
      "done": true
    },
    {
      "slots": [
        "도토리인형"
      ],
      "done": true
    }
  ],
  "노르딘": [
    {
      "slots": [
        "+도토리정원",
        "히힛산군발싸",
        "이솔보리",
        "0뀬땬쨩",
        "F4ide",
        "타니쟈"
      ],
      "done": true
    },
    {
      "slots": [
        "히힛도심발싸",
        "기무유느기",
        "민주원",
        "4XOy",
        "이솔화련"
      ],
      "done": true
    }
  ],
  "종막": [
    {
      "slots": [
        "+자몽초",
        "핑크보라돼지",
        "이솔나린",
        "아무래도시커먼",
        "감자옴뇸뇽"
      ],
      "done": true
    },
    {
      "slots": [
        "+가치",
        "F4ide",
        "이솔화련",
        "타니쟈",
        "아포가토시커먼"
      ],
      "done": true
    },
    {
      "slots": [
        "나우보리",
        "기무유느기",
        "4XOy",
        "히힛내공발싸",
        "+타닥도토리"
      ],
      "done": true
    },
    {
      "slots": [
        "0군단장",
        "당연아",
        "밤옴뇸뇽",
        "히솔발",
        "+그냥시커먼"
      ],
      "done": true
    },
    {
      "slots": [
        "아마도시커먼",
        "장봉삼",
        "때굴때굴도토리",
        "히힛용숨발싸"
      ],
      "done": true
    },
    {
      "slots": [
        "0뀬땬쨩",
        "민주원",
        "이솔보리"
      ],
      "done": true
    }
  ],
  "4막": [
    {
      "slots": [
        "당연아",
        "히솔발",
        "아포가토시커먼",
        "+타닥도토리",
        "레린카"
      ],
      "done": true
    },
    {
      "slots": [
        "때굴때굴도토리",
        "히힛내공발싸",
        "장봉삼",
        "+그냥시커먼"
      ],
      "done": true
    },
    {
      "slots": [
        "아무래도시커먼",
        "히힛용숨발싸",
        "이솔나린",
        "+옥수수옴뇸뇽"
      ],
      "done": true
    },
    {
      "slots": [
        "밤옴뇸뇽"
      ],
      "done": true
    },
    {
      "slots": [
        "감자옴뇸뇽"
      ],
      "done": true
    },
    {
      "slots": []
    }
  ],
  "나르카": [
    {
      "slots": [
        "+자몽초",
        "히힛산군발싸",
        "F4ide",
        "민주원"
      ],
      "done": true
    },
    {
      "slots": [
        "+가치",
        "0군단장",
        "기무유느기",
        "이솔보리"
      ],
      "done": true
    },
    {
      "slots": [
        "아마도시커먼",
        "+도토리정원",
        "히힛도심발싸",
        "4XOy"
      ],
      "done": true
    },
    {
      "slots": [
        "나우보리",
        "도토리인형",
        "핑크보라돼지"
      ],
      "done": true
    }
  ],
  "하르카": [
    {
      "slots": [
        "+그냥시커먼",
        "이솔나린",
        "히힛용숨발싸",
        "때굴때굴도토리"
      ],
      "done": true
    },
    {
      "slots": [
        "타니쟈",
        "+타닥도토리",
        "장봉삼"
      ],
      "done": true
    },
    {
      "slots": [
        "당연아",
        "히솔발",
        "아무래도시커먼"
      ],
      "done": true
    },
    {
      "slots": [
        "히힛내공발싸",
        "아포가토시커먼",
        "밤옴뇸뇽"
      ],
      "done": true
    },
    {
      "slots": [
        "이솔화련",
        "감자옴뇸뇽"
      ],
      "done": true
    },
    {
      "slots": []
    }
  ],
  "3성당": [
    {
      "slots": [
        "+가치",
        "핑크보라돼지",
        "기무유느기",
        "4XOy"
      ],
      "done": true
    },
    {
      "slots": [
        "0군단장",
        "히힛산군발싸",
        "타니쟈"
      ],
      "done": true
    },
    {
      "slots": [
        "아마도시커먼",
        "나우보리",
        "히힛도심발싸"
      ],
      "done": true
    },
    {
      "slots": []
    }
  ],
  "2성당": []
}

export const SEED_MEMBER_COLORS: MemberColors = {}

export const GOLD_LEVELS: GoldRow[] = [
  {
    "level": "1710",
    "tradable": 45500,
    "bound": 45500,
    "total": 91000
  },
  {
    "level": "1720 (성당)",
    "tradable": 54000,
    "bound": 56000,
    "total": 110000
  },
  {
    "level": "1720 (세르카)",
    "tradable": 70000,
    "bound": 32000,
    "total": 102000
  },
  {
    "level": "1730",
    "tradable": 130000,
    "bound": 0,
    "total": 130000
  },
  {
    "level": "1740",
    "tradable": 140000,
    "bound": 0,
    "total": 140000
  },
  {
    "level": "1750 (성당)",
    "tradable": 104000,
    "bound": 50000,
    "total": 154000
  },
  {
    "level": "1750 (종막)",
    "tradable": 152000,
    "bound": 0,
    "total": 152000
  },
  {
    "level": "1770 (성당)",
    "tradable": 116000,
    "bound": 50000,
    "total": 166000
  },
  {
    "level": "1770 (종막)",
    "tradable": 164000,
    "bound": 0,
    "total": 164000
  },
  {
    "level": "1780 (성당)",
    "tradable": 129000,
    "bound": 50000,
    "total": 179000
  },
  {
    "level": "1780 (종막)",
    "tradable": 177000,
    "bound": 0,
    "total": 177000
  }
]

export const RAID_GOLD: RaidGoldRow[] = [
  {
    "raid": "성심당",
    "difficulty": "1단계",
    "total": 30000,
    "tradable": 0,
    "bound": 30000
  },
  {
    "raid": "성심당",
    "difficulty": "2단계",
    "total": 40000,
    "tradable": 0,
    "bound": 40000
  },
  {
    "raid": "성심당",
    "difficulty": "3단계",
    "total": 50000,
    "tradable": 0,
    "bound": 50000
  },
  {
    "raid": "4막",
    "difficulty": "노말",
    "total": 27000,
    "tradable": 13500,
    "bound": 13500
  },
  {
    "raid": "4막",
    "difficulty": "하드",
    "total": 38000,
    "tradable": 38000,
    "bound": 0
  },
  {
    "raid": "종막",
    "difficulty": "노말",
    "total": 32000,
    "tradable": 16000,
    "bound": 16000
  },
  {
    "raid": "종막",
    "difficulty": "하드",
    "total": 48000,
    "tradable": 48000,
    "bound": 0
  },
  {
    "raid": "세르카",
    "difficulty": "노말",
    "total": 32000,
    "tradable": 16000,
    "bound": 16000
  },
  {
    "raid": "세르카",
    "difficulty": "하드",
    "total": 44000,
    "tradable": 44000,
    "bound": 0
  },
  {
    "raid": "세르카",
    "difficulty": "나이트메어",
    "total": 54000,
    "tradable": 54000,
    "bound": 0
  },
  {
    "raid": "벨가르딘",
    "difficulty": "노말",
    "total": 50000,
    "tradable": 50000,
    "bound": 0
  },
  {
    "raid": "벨가르딘",
    "difficulty": "하드",
    "total": 62000,
    "tradable": 62000,
    "bound": 0
  },
  {
    "raid": "벨가르딘",
    "difficulty": "나이트메어",
    "total": 75000,
    "tradable": 75000,
    "bound": 0
  }
]

export const SEED_SECTIONS: Sections = {
  characters: SEED_CHARACTERS,
  raids: SEED_RAIDS,
  checks: SEED_CHECKS,
  sourceAssignments: SEED_ASSIGNMENTS,
  assignments: SEED_ASSIGNMENTS,
  memberColors: SEED_MEMBER_COLORS,
}

// 레이드 체크 항목별 1캐릭터 클리어 골드(총액 기준). 대시보드 예상 골드 계산에 사용합니다.
// 종막·4막은 시트가 노말을 삭제하고 하드 기준으로 간소화했으므로 하드 총액을 넣었습니다.
export const RAID_ID_GOLD: Record<string, number> = {
  "나르딘": 75000,
  "하르딘": 62000,
  "노르딘": 50000,
  "종막": 48000,
  "4막": 38000,
  "나르카": 54000,
  "하르카": 44000,
  "3성당": 50000,
  "2성당": 40000,
}
