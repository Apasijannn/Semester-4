import { formatCurrency } from '../../utils/format'

// 8 distinct colors (all already part of the app's existing palette) so all
// 7 official categories plus one spare get a unique swatch — previously only
// 6 were defined, so two categories could end up sharing an identical color.
const COLORS = ['#fd5179', '#003a29', '#c2c5db', '#b71849', '#77767d', '#27e0a9', '#5a5d70', '#910034']
const CIRCUMFERENCE = 2 * Math.PI * 40

export function AllocationDonut({ allocation }) {
  const total = allocation.reduce((sum, a) => sum + a.amount, 0)
  let offsetSoFar = 0

  return (
    <div className="bento-card col-span-1 md:col-span-4 p-bento-padding flex flex-col items-center justify-center relative min-h-[280px]">
      <span className="absolute top-bento-padding left-bento-padding font-label-caps text-label-caps text-on-surface-variant px-2 py-1 border border-outline rounded-sm bg-surface z-10">
        Allocation
      </span>
      <div className="relative w-48 h-48 mt-8">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle className="opacity-50" cx="50" cy="50" fill="none" r="40" stroke="#e6e2d8" strokeWidth="12" />
          {total === 0 ? null : (
            allocation.map((slice, i) => {
              const length = (slice.amount / total) * CIRCUMFERENCE
              const dashArray = `${length} ${CIRCUMFERENCE}`
              const dashOffset = -offsetSoFar
              offsetSoFar += length
              return (
                <circle
                  key={slice.category}
                  cx="50"
                  cy="50"
                  fill="none"
                  r="40"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth="14"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(2px 2px 0px #181c2c)' }}
                />
              )
            })
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-2 px-4 text-center">
          <span className="font-headline-lg text-[18px] font-bold text-primary leading-tight">{formatCurrency(total)}</span>
          <span className="font-label-caps text-[10px] text-on-surface-variant">SPENT</span>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2 mt-4 justify-center">
        {allocation.map((slice, i) => (
          <li key={slice.category} className="flex items-center gap-1 font-label-caps text-[10px]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            {slice.category}
          </li>
        ))}
      </ul>
    </div>
  )
}
