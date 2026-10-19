const STATUS_FILTERS = [
  { key: 'all', label: 'ALL' },
  { key: 'todo', label: 'ACTIVE' },
  { key: 'urgent', label: 'URGENT' },
  { key: 'done', label: 'DONE' },
]

export function TaskFilters({ active, onChange }) {
  return (
    <div className="flex gap-stack-sm items-center flex-wrap">
      <span className="font-label-caps text-label-caps mr-2">FILTER:</span>
      {STATUS_FILTERS.map((f, i) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onChange(f.key)}
          className={`font-label-caps text-label-caps px-3 py-1 washi-tape transition-transform hover:rotate-0 ${
            active === f.key ? 'washi-tape-green' : ''
          }`}
          style={{ transform: `rotate(${i % 2 === 0 ? -2 : 1}deg)` }}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
