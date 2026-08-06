import type { Character } from './types'

// 서포터 각인을 주로 쓰는 직업. 여기 없는 직업은 기본 딜러로 봅니다.
// 어디까지나 기본값이고, 실제 역할은 캐릭터 탭에서 캐릭터별로 바꿀 수 있습니다.
const SUPPORT_CLASSES = new Set(['바드', '홀리나이트', '도화가', '발키리'])

export type Role = 'dealer' | 'support'

/** 캐릭터의 실제 역할. 수동 지정이 있으면 그 값을, 없으면 직업 기본값을 씁니다. */
export function charRole(c: Character): Role {
  return c.role ?? (SUPPORT_CLASSES.has(c.clazz) ? 'support' : 'dealer')
}

export function isSupportChar(c: Character): boolean {
  return charRole(c) === 'support'
}
