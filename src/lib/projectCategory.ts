import type { ProjectCategory } from '../types/api'

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  INTERIOR_DESIGN: 'Interior Design',
  PRODUCT_DESIGN: 'Product Design',
  SPACE_PLANNING: 'Space Planning',
  DESIGN_CONSULTATION: 'Design Consultation',
}

export const CATEGORY_OPTIONS: Array<{ value: ProjectCategory; label: string }> = (
  Object.keys(CATEGORY_LABELS) as ProjectCategory[]
).map((value) => ({ value, label: CATEGORY_LABELS[value] }))
