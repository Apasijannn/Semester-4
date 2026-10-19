export function Modal({ open, onClose, title, children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40" onClick={onClose}>
      <div
        className="bento-card paper-grain bg-surface-container-lowest p-bento-padding w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-stack-md border-b-2 border-primary border-dashed pb-stack-sm">
          <h3 className="font-headline-lg text-headline-lg text-primary">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="material-symbols-outlined text-primary hover:text-secondary transition-colors"
          >
            close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
