export function BentoCard({ as: Tag = 'div', className = '', interactive = false, children, ...rest }) {
  return (
    <Tag className={`bento-card ${interactive ? 'interactive cursor-pointer' : ''} p-bento-padding ${className}`} {...rest}>
      {children}
    </Tag>
  )
}
