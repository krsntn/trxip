import { encode } from 'uqr'
import { cn } from '@/lib/utils'

/** Dark modules on white, with the 4-module quiet zone that scanners need on a dark page. */
export function QrCode({ text, label, className }: { text: string; label: string; className?: string }) {
  const { data, size } = encode(text, { ecc: 'M', border: 0 })
  let path = ''
  data.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) path += `M${x} ${y}h1v1h-1z`
    }),
  )
  return (
    <svg
      viewBox={`-4 -4 ${size + 8} ${size + 8}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={cn('rounded-lg bg-white', className)}
    >
      <path d={path} fill="#000" />
    </svg>
  )
}
