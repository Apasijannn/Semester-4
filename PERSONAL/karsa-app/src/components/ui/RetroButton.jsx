const VARIANTS = {
  primary: 'bg-primary text-on-primary',
  secondary: 'bg-secondary text-on-secondary',
  tertiary: 'bg-tertiary-fixed text-on-tertiary-fixed',
  ghost: 'bg-surface text-primary',
}

export function RetroButton({ variant = 'primary', className = '', icon, children, ...rest }) {
  return (
    <button
      className={`btn-retro font-label-caps text-label-caps py-2 px-4 flex items-center justify-center gap-2 uppercase tracking-wide ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
      {children}
    </button>
  )
}
