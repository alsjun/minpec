export interface LopecScore {
  /** 로펙 캐릭터 화면의 현재 점수(specPoint) */
  currentScore: number | null
  /** 로펙 내부 최고 점수로 쓰는 값(dbScore) */
  bestScore: number | null
  /** 현재 아이템 레벨 구간의 로펙 중앙값 */
  median: number | null
  /** 현재 점수와 중앙값 차이 */
  delta: number | null
}

export interface GemEfficiencyEffect {
  name: string
  level: number
  effect: number
}

export interface GemEfficiency {
  total: number | null
  median: number | null
  effects: GemEfficiencyEffect[]
}

export interface Character {
  /** 시트의 순서 코드(건1, 민2 등). 표시용으로만 사용합니다. */
  code: string
  /** 캐릭터 주인(본부계 기준) */
  member: string
  name: string
  account: string
  clazz: string
  combatPower: number | null
  itemLevel: number | null
  lopec?: LopecScore
  gemEfficiency?: GemEfficiency
  /** 마지막 API 갱신 시각(ISO). 갱신 스크립트가 채웁니다. */
  updatedAt?: string
  /** 로펙 점수/젬 효율 갱신 시각(ISO). */
  lopecUpdatedAt?: string
  lopecError?: string | null
  /**
   * 역할 수동 지정. 비어 있으면 직업으로 추정합니다.
   * 발키리 딜러처럼 직업과 역할이 다른 캐릭터를 위해 존재합니다.
   */
  role?: 'dealer' | 'support'
}

export interface Raid {
  /** 시트에서 쓰던 짧은 이름을 그대로 id로 사용합니다. */
  id: string
  /** 전체 이름(툴팁 표시용) */
  name: string
  /** 한 팟 인원수. 레이드마다 다르므로 보드에서 수정할 수 있습니다. */
  partySize: number
  active: boolean
}

/** 캐릭터 이름 -> 레이드 id -> 참여 여부 */
export type Checks = Record<string, Record<string, boolean>>

/** 팟 하나. 인원이 덜 차도 이 인원으로 가기로 했다면 done을 켭니다. */
export interface Party {
  slots: (string | null)[]
  done?: boolean
  /** 이번 주에 이 팟이 레이드를 이미 돌았으면 true. 수요일 초기화 때 풀립니다. */
  cleared?: boolean
}

/**
 * 레이드 id -> 팟 목록.
 * 예전 데이터는 팟이 slots 배열만으로 저장돼 있을 수 있어, 읽을 때 normalizeParties로 감쌉니다.
 */
export type Assignments = Record<string, Party[]>

/** 본부계/멤버 이름 -> 표시 색상 */
export type MemberColors = Record<string, string>

/** 팀 공용 설정. 로아 API 키를 여기 두면 팀원 모두가 따로 입력하지 않아도 됩니다. */
export interface Settings {
  lostarkApiKey?: string
}

/** 원본 시트 저장 시 함께 남는 편성 스냅샷. 이전 저장본으로 되돌릴 때 사용합니다. */
export interface Preset {
  name: string
  savedAt: string
  assignments: Assignments
}

export interface Sections {
  characters: Character[]
  raids: Raid[]
  checks: Checks
  /** 편성 보드에서 불러올 기준 원본 레이드표 */
  sourceAssignments: Assignments
  /** 실제 작업 중인 편성 보드 */
  assignments: Assignments
  memberColors: MemberColors
  settings: Settings
  presets: Preset[]
}

export interface GoldRow {
  level: string
  tradable: number
  bound: number
  total: number
}

export interface RaidGoldRow {
  raid: string
  difficulty: string
  total: number
  tradable: number
  bound: number
}
