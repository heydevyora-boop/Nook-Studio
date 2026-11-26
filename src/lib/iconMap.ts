import type { ComponentType } from 'react'
import { Armchair, Box, Flower2, Layers3, PencilRuler, Sparkles, Hammer } from 'lucide-react'
import PeacockIcon from '../components/icons/PeacockIcon'
import LotusIcon from '../components/icons/LotusIcon'

/** A lucide-react icon or one of our own (image-based) icon components. */
export type ServiceIconComponent = ComponentType<{ className?: string; strokeWidth?: number | string }>

/** Maps a Service's `icon` string (stored in the backend) to an icon component. */
export const ICON_MAP: Record<string, ServiceIconComponent> = {
  armchair: Armchair,
  box: Box,
  layers: Layers3,
  flower: Flower2,
  peacock: PeacockIcon,
  lotus: LotusIcon,
  elevation: PencilRuler,
  renovation: Hammer,
}

export const ICON_OPTIONS: Array<{ value: string; label: string; Icon: ServiceIconComponent }> = [
  { value: 'armchair', label: 'Armchair', Icon: Armchair },
  { value: 'box', label: 'Box', Icon: Box },
  { value: 'layers', label: 'Layers', Icon: Layers3 },
  { value: 'flower', label: 'Flower', Icon: Flower2 },
  { value: 'peacock', label: 'Peacock', Icon: PeacockIcon },
  { value: 'lotus', label: 'Lotus', Icon: LotusIcon },
  { value: 'elevation', label: 'Elevation (drafting)', Icon: PencilRuler },
  { value: 'renovation', label: 'Renovation (hammer)', Icon: Hammer },
]

export function getServiceIcon(icon: string): ServiceIconComponent {
  return ICON_MAP[icon] ?? Sparkles
}
