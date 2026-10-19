/* =========================================================================
   REUSABLE PRIMITIVES — Card, Button, Badge  (shared across every page)
   ========================================================================= */
export function Card({ className = "", children, as: Tag = "div", ...rest }) {
  return (
    <Tag className={`border-3 border-line rounded-2xl shadow-sticker ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function Button({ color = "yellow", variant = "solid", className = "", children, ...rest }) {
  const solid = `bg-${color} text-ink shadow-sticker`;
  const dark = `bg-ink text-${color} shadow-[3px_3px_0_rgba(0,0,0,0.25)]`;
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 border-3 border-line rounded-xl px-4 py-3 font-sans font-bold text-[15px] cursor-pointer transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${variant === "dark" ? dark : solid} ${className}`}
      {...rest}>
      {children}
    </button>
  );
}

export function Badge({ color = "cream", mono = true, className = "", children }) {
  return (
    <span className={`inline-block bg-${color} text-ink border-2 border-line rounded-full px-2.5 py-[3px] text-[10.5px] font-bold ${mono ? "font-mono" : "font-sans"} ${className}`}>
      {children}
    </span>
  );
}
