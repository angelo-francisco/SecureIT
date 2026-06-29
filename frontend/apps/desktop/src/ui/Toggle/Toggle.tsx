import { type InputHTMLAttributes } from "react";

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Toggle({ label, checked, onChange, ...props }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
          {...props}
        />
        <div className="w-11 h-6 rounded-full bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 transition-colors duration-200 peer-checked:bg-primary" />
        <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 peer-checked:translate-x-5" />
      </div>
      <span className="text-sm text-text">{label}</span>
    </label>
  );
}
