export function WashiChip({ tone = 'secondary', className = '', children }) {
  const toneClass = tone === 'tertiary' ? 'washi-tape-green' : 'washi-tape'
  return (
    <span className={`inline-block px-3 py-1 font-label-caps text-label-caps font-bold ${toneClass} ${className}`}>
      {children}
    </span>
  )
}
