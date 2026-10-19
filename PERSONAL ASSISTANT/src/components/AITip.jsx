import { Icon } from "./icons.jsx";
import { Card, Button, Badge } from "./primitives.jsx";

export function AITip({ accent, title, children, action }) {
  return (
    <Card className={`bg-${accent} shadow-sticker-lg p-5 flex items-center gap-[18px] text-ink`}>
      <div className="shrink-0 w-14 h-14 bg-ink text-white rounded-[15px] flex items-center justify-center"><Icon name="bot" size={28} sw={2.2} /></div>
      <div className="flex-1">
        <div className="flex items-center gap-2.5 mb-1.5"><Badge color="ink" className="!text-white">KARSA AI</Badge><span className="font-display text-[17px]">{title}</span></div>
        <p className="m-0 text-[14.5px] font-medium leading-snug">{children}</p>
      </div>
      <Button variant="dark" color={accent} className="shrink-0">{action}</Button>
    </Card>
  );
}
