import { WashiChip } from '../ui/WashiChip'
import { formatCurrency } from '../../utils/format'

export function BalanceCard({ balance, income, expense }) {
  const isNegative = balance < 0
  const formattedAmount = Math.round(Math.abs(balance)).toLocaleString('id-ID')

  return (
    <div className="bento-card col-span-1 md:col-span-8 p-bento-padding relative overflow-hidden flex flex-col justify-between min-h-[280px]">
      <div className="flex justify-between items-start z-10">
        <span className="font-label-caps text-label-caps text-on-surface-variant px-2 py-1 border border-outline rounded-sm uppercase bg-surface">
          Current_Balance
        </span>
        <WashiChip tone="tertiary">
          IN {formatCurrency(income)} / OUT {formatCurrency(expense)}
        </WashiChip>
      </div>
      <div className="mt-stack-lg z-10">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-headline-xl text-[32px] md:text-[48px] font-black text-primary leading-none tracking-tighter">
            {isNegative ? '-Rp' : 'Rp'}
          </span>
          <span className="font-headline-xl text-[48px] md:text-[80px] font-black text-primary leading-none tracking-tighter">
            {formattedAmount}
          </span>
        </div>
      </div>
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#181c2c 1px, transparent 1px), linear-gradient(90deg, #181c2c 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
    </div>
  )
}
