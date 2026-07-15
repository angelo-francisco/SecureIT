import type { InputHTMLAttributes, FC } from "react";
import * as Lucide from "lucide-react";
import { Input } from "../components/ui/input";

type LucideIconName = {
  [K in keyof typeof Lucide]: (typeof Lucide)[K] extends FC<Lucide.LucideProps>
    ? K
    : never;
}[keyof typeof Lucide];

interface LucideInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIconName;
}

export function LucideInput({ className, icon, ...props }: LucideInputProps) {
  const IconComponent = icon ? (Lucide[icon] as FC<Lucide.LucideProps>) : null;

  return (
    <div className="relative w-full">
      <Input
        className={`${IconComponent ? "pr-12" : ""} ${className ?? ""}`}
        {...props}
      />
      {IconComponent && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
          <IconComponent size={16} />
        </div>
      )}
    </div>
  );
}
