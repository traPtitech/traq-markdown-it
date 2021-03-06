import type Md from 'markdown-it'
import container from 'markdown-it-container'

const defaultLabels = ['success', 'info', 'warning', 'danger'] as const

export const useContainer = (
  md: Md,
  labels: readonly string[] = defaultLabels
): void => {
  labels.forEach(label => {
    md.use(container, label)
  })
}
