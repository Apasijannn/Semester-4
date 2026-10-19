import { Link } from 'react-router-dom'

export function MobileTopBar() {
  return (
    <header className="md:hidden flex justify-between items-center px-grid-margin py-stack-sm w-full bg-background border-b-4 border-primary shrink-0 sticky top-0 z-30">
      <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">KARSA_OS</span>
      <Link to="/settings" className="material-symbols-outlined text-primary active:scale-95">
        settings
      </Link>
    </header>
  )
}
