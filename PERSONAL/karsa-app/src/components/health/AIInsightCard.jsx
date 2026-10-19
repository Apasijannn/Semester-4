export function AIInsightCard({ insight, status, hasApiKey, onRefresh }) {
  const isLoading = status === 'loading'
  const hasError = status === 'error'
  const showFallback = !hasApiKey || !insight || hasError

  return (
    <div className="md:col-span-3 sticky-note p-bento-padding flex flex-col justify-center items-center relative">
      {hasApiKey && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh insight"
          className="absolute top-2 right-2 material-symbols-outlined text-primary text-[18px] hover:text-secondary transition-colors disabled:opacity-40"
        >
          refresh
        </button>
      )}

      {isLoading ? (
        <p className="font-headline-lg-mobile text-headline-lg-mobile text-primary text-center leading-tight">
          Thinking...
        </p>
      ) : showFallback ? (
        <p className="font-headline-lg-mobile text-headline-lg-mobile text-primary text-center leading-tight">
          "DRINK WATER.<br />DON'T DIE."
        </p>
      ) : (
        <p className="font-body-md text-body-md text-primary text-center leading-snug">{insight}</p>
      )}

      {hasError && (
        <p className="font-label-caps text-[10px] text-secondary text-center mt-2">Insight tidak tersedia saat ini</p>
      )}

      <div className="mt-4 font-label-caps text-label-caps text-on-surface-variant self-end">
        {showFallback ? '- Management' : '- Karsa AI'}
      </div>
    </div>
  )
}
