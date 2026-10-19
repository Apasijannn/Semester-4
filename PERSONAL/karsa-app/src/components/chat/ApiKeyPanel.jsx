import { Link } from 'react-router-dom'

export function ApiKeyPanel() {
  return (
    <div className="brutal-border bg-error-container text-on-error-container p-stack-md flex items-center justify-between gap-stack-md flex-wrap">
      <p className="font-body-sm text-body-sm">
        No Anthropic API key set. Karsa can't reply until you add one.
      </p>
      <Link
        to="/settings"
        className="font-label-caps text-label-caps underline underline-offset-4 hover:text-secondary transition-colors whitespace-nowrap"
      >
        GO TO SETTINGS
      </Link>
    </div>
  )
}
