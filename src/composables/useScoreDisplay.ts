import { computed } from 'vue'
import { SCORE_THRESHOLDS, SCORE_COLORS, SCORE_LABELS } from '@/config/constants'

export function useScoreDisplay() {
  const getScoreColor = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return 'default'
    if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_COLORS[SCORE_THRESHOLDS.EXCELLENT]
    if (score >= SCORE_THRESHOLDS.GOOD) return SCORE_COLORS[SCORE_THRESHOLDS.GOOD]
    if (score >= SCORE_THRESHOLDS.SATISFACTORY) return SCORE_COLORS[SCORE_THRESHOLDS.SATISFACTORY]
    if (score >= SCORE_THRESHOLDS.NEEDS_IMPROVEMENT) return SCORE_COLORS[SCORE_THRESHOLDS.NEEDS_IMPROVEMENT]
    if (score >= SCORE_THRESHOLDS.POOR) return SCORE_COLORS[SCORE_THRESHOLDS.POOR]
    return 'red'
  }

  const getScoreLabel = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return '未评分'
    if (score >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_LABELS[SCORE_THRESHOLDS.EXCELLENT]
    if (score >= SCORE_THRESHOLDS.GOOD) return SCORE_LABELS[SCORE_THRESHOLDS.GOOD]
    if (score >= SCORE_THRESHOLDS.SATISFACTORY) return SCORE_LABELS[SCORE_THRESHOLDS.SATISFACTORY]
    if (score >= SCORE_THRESHOLDS.NEEDS_IMPROVEMENT) return SCORE_LABELS[SCORE_THRESHOLDS.NEEDS_IMPROVEMENT]
    if (score >= SCORE_THRESHOLDS.POOR) return SCORE_LABELS[SCORE_THRESHOLDS.POOR]
    return '不及格'
  }

  const getScorePercentage = (score: number, totalScore: number = 60): number => {
    if (totalScore === 0) return 0
    return Math.round((score / totalScore) * 100)
  }

  const useReactiveScoreDisplay = (score: { value: number | null | undefined }) => {
    return {
      scoreColor: computed(() => getScoreColor(score.value)),
      scoreLabel: computed(() => getScoreLabel(score.value)),
      scorePercentage: computed(() => score.value !== null && score.value !== undefined ? getScorePercentage(score.value) : 0),
    }
  }

  return {
    getScoreColor,
    getScoreLabel,
    getScorePercentage,
    useReactiveScoreDisplay,
  }
}