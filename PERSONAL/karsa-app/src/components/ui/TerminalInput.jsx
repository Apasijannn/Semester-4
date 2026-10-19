export function TerminalInput({ className = '', ...rest }) {
  return (
    <input
      className={`terminal-input font-body-md text-body-md py-2 px-1 w-full focus:ring-0 placeholder:text-outline-variant ${className}`}
      {...rest}
    />
  )
}
