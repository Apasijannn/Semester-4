export function HandDrawnCheckbox({ checked, onChange, className = '' }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={`w-6 h-6 border-2 border-primary flex items-center justify-center shrink-0 transition-colors ${
        checked ? 'bg-primary' : 'bg-surface hover:bg-surface-variant'
      } ${className}`}
    >
      {checked && (
        <span className="material-symbols-outlined text-on-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          close
        </span>
      )}
    </button>
  )
}
