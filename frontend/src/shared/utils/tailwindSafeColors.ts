/**
 * Tailwind 동적 클래스 purge 방지: 색상별로 전체 클래스명을 상수로 정의.
 * bg-${color}-500 같은 동적 클래스는 빌드 시 제거되므로 이 매핑 사용.
 */
export const COLOR = {
  cyan: {
    ring: 'border-cyan-500/40',
    card: 'from-cyan-900/30 to-cyan-800/20',
    accentBg: 'bg-cyan-500/20',
    accentText: 'text-cyan-300',
    icon: 'text-cyan-400',
    pill: 'bg-cyan-500/20 text-cyan-300',
    selected: 'bg-cyan-500/20 border-2 border-cyan-500',
  },
  green: {
    ring: 'border-green-500/40',
    card: 'from-green-900/30 to-emerald-900/20',
    accentBg: 'bg-green-500/20',
    accentText: 'text-green-300',
    icon: 'text-green-400',
    pill: 'bg-green-500/20 text-green-300',
    selected: 'bg-green-500/20 border-2 border-green-500',
  },
  yellow: {
    ring: 'border-yellow-500/40',
    card: 'from-yellow-900/30 to-amber-900/20',
    accentBg: 'bg-yellow-500/20',
    accentText: 'text-yellow-300',
    icon: 'text-yellow-400',
    pill: 'bg-yellow-500/20 text-yellow-300',
    selected: 'bg-yellow-500/20 border-2 border-yellow-500',
  },
  purple: {
    ring: 'border-purple-500/40',
    card: 'from-purple-900/30 to-violet-900/20',
    accentBg: 'bg-purple-500/20',
    accentText: 'text-purple-300',
    icon: 'text-purple-400',
    pill: 'bg-purple-500/20 text-purple-300',
    selected: 'bg-purple-500/20 border-2 border-purple-500',
  },
} as const

export type ColorKey = keyof typeof COLOR
