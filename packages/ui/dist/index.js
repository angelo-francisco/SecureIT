// src/lib/cn.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/tokens/colors.ts
var colors = {
  primary: "#2C9ED5",
  "primary-hover": "#2586B5",
  background: {
    dark: "#101922",
    light: "#ffffff"
  },
  surface: {
    dark: "#1c2127",
    hover: "#283039"
  },
  border: {
    dark: "#3b4754"
  },
  text: {
    muted: "#9dabb9",
    secondary: "#9dabb9"
  },
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6"
};

// src/tokens/typography.ts
var typography = {
  fontFamily: {
    display: "'Poppins', sans-serif",
    body: "'Noto Sans', sans-serif"
  }
};

// src/components/Button/Button.tsx
import { cva } from "class-variance-authority";
import { jsx, jsxs } from "react/jsx-runtime";
var buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90",
        secondary: "bg-surface-hover text-text-muted hover:bg-surface-hover hover:text-text",
        danger: "bg-error text-white hover:bg-error/90",
        ghost: "text-text-muted hover:text-text hover:bg-surface-hover",
        outline: "border border-border bg-transparent text-text hover:bg-surface-hover"
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);
function Button({
  variant,
  size,
  icon,
  children,
  className,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      className: cn(buttonVariants({ variant, size }), className),
      ...props,
      children: [
        icon && /* @__PURE__ */ jsx("span", { children: icon }),
        children
      ]
    }
  );
}

// src/components/Badge/Badge.tsx
import { cva as cva2 } from "class-variance-authority";
import { jsx as jsx2 } from "react/jsx-runtime";
var badgeVariants = cva2(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-primary/15 text-primary border border-primary/25",
        success: "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25",
        warning: "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/25",
        danger: "bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/25",
        info: "bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/25",
        outline: "text-text-muted border border-border"
      }
    },
    defaultVariants: {
      variant: "primary"
    }
  }
);
var variantMap = {
  success: "success",
  error: "danger",
  danger: "danger",
  warning: "warning",
  info: "info",
  primary: "primary",
  outline: "outline"
};
function Badge({ variant = "info", children, className }) {
  return /* @__PURE__ */ jsx2("span", { className: cn(badgeVariants({ variant: variantMap[variant] }), className), children });
}

// src/components/Input/Input.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
function Input({ className, type, ...props }) {
  return /* @__PURE__ */ jsx3(
    "input",
    {
      type,
      className: cn(
        "flex h-12 w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-text-muted file:border-0 file:bg-transparent file:text-sm file:font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition",
        className
      ),
      ...props
    }
  );
}

// src/components/Select/Select.tsx
import { jsx as jsx4 } from "react/jsx-runtime";
function Select({ options, className, ...props }) {
  return /* @__PURE__ */ jsx4(
    "select",
    {
      className: cn(
        "h-12 w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors appearance-none",
        className
      ),
      ...props,
      children: options.map((opt) => /* @__PURE__ */ jsx4("option", { value: opt.value, children: opt.label }, opt.value))
    }
  );
}

// src/components/Table/Table.tsx
import { jsx as jsx5, jsxs as jsxs2 } from "react/jsx-runtime";
var ShadcnTable = ({ className, ...props }) => /* @__PURE__ */ jsx5("div", { className: "relative w-full overflow-auto", children: /* @__PURE__ */ jsx5("table", { className: cn("w-full caption-bottom text-sm", className), ...props }) });
var TableHeader = ({ className, ...props }) => /* @__PURE__ */ jsx5("thead", { className: cn("[&_tr]:border-b border-border-light", className), ...props });
var TableBody = ({ className, ...props }) => /* @__PURE__ */ jsx5("tbody", { className: cn("[&_tr:last-child]:border-0", className), ...props });
var TableRow = ({ className, ...props }) => /* @__PURE__ */ jsx5(
  "tr",
  {
    className: cn(
      "border-b border-border-light transition-colors hover:bg-surface/50 data-[state=selected]:bg-surface-hover",
      className
    ),
    ...props
  }
);
var TableHead = ({ className, ...props }) => /* @__PURE__ */ jsx5(
  "th",
  {
    className: cn(
      "h-12 px-4 text-left align-middle font-semibold text-text-muted text-xs uppercase tracking-wider",
      className
    ),
    ...props
  }
);
var TableCell = ({ className, ...props }) => /* @__PURE__ */ jsx5("td", { className: cn("p-4 align-middle", className), ...props });
function Table({ columns, data }) {
  return /* @__PURE__ */ jsxs2(ShadcnTable, { children: [
    /* @__PURE__ */ jsx5(TableHeader, { children: /* @__PURE__ */ jsx5(TableRow, { children: columns.map((col) => /* @__PURE__ */ jsx5(TableHead, { className: col.className, children: col.header }, col.key)) }) }),
    /* @__PURE__ */ jsx5(TableBody, { children: data.map((row, rowIdx) => /* @__PURE__ */ jsx5(TableRow, { children: columns.map((col) => /* @__PURE__ */ jsx5(TableCell, { className: col.className, children: col.render ? col.render(row) : String(row[col.key] ?? "") }, col.key)) }, rowIdx)) })
  ] });
}

// src/components/Modal/Modal.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
function Modal({ open, onClose, children, className = "" }) {
  if (!open) return null;
  return /* @__PURE__ */ jsx6(
    "div",
    {
      className: "fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-[1000]",
      onClick: (e) => {
        if (e.target === e.currentTarget) onClose?.();
      },
      children: /* @__PURE__ */ jsx6("div", { className, children })
    }
  );
}

// src/components/Loader/Loader.tsx
import { jsx as jsx7, jsxs as jsxs3 } from "react/jsx-runtime";
function Loader({ w = 24 }) {
  return /* @__PURE__ */ jsx7(
    "svg",
    {
      fill: "#FFFFFFFF",
      viewBox: "0 0 24 24",
      xmlns: "http://www.w3.org/2000/svg",
      style: { width: w, height: "auto" },
      children: /* @__PURE__ */ jsxs3("g", { children: [
        /* @__PURE__ */ jsx7("rect", { x: "11", y: "1", width: "2", height: "5", opacity: ".14" }),
        /* @__PURE__ */ jsx7("rect", { x: "11", y: "1", width: "2", height: "5", transform: "rotate(30 12 12)", opacity: ".29" }),
        /* @__PURE__ */ jsx7("rect", { x: "11", y: "1", width: "2", height: "5", transform: "rotate(60 12 12)", opacity: ".43" }),
        /* @__PURE__ */ jsx7("rect", { x: "11", y: "1", width: "2", height: "5", transform: "rotate(90 12 12)", opacity: ".57" }),
        /* @__PURE__ */ jsx7("rect", { x: "11", y: "1", width: "2", height: "5", transform: "rotate(120 12 12)", opacity: ".71" }),
        /* @__PURE__ */ jsx7("rect", { x: "11", y: "1", width: "2", height: "5", transform: "rotate(150 12 12)", opacity: ".86" }),
        /* @__PURE__ */ jsx7("rect", { x: "11", y: "1", width: "2", height: "5", transform: "rotate(180 12 12)" }),
        /* @__PURE__ */ jsx7(
          "animateTransform",
          {
            attributeName: "transform",
            type: "rotate",
            calcMode: "discrete",
            dur: "0.75s",
            values: "0 12 12;30 12 12;60 12 12;90 12 12;120 12 12;150 12 12;180 12 12;210 12 12;240 12 12;270 12 12;300 12 12;330 12 12;360 12 12",
            repeatCount: "indefinite"
          }
        )
      ] })
    }
  );
}

// src/components/Pagination/Pagination.tsx
import * as Lucide from "lucide-react";
import { jsx as jsx8, jsxs as jsxs4 } from "react/jsx-runtime";
function Pagination({
  page,
  numPages,
  hasNext,
  hasPrevious,
  onPageChange
}) {
  return /* @__PURE__ */ jsx8("div", { className: "text-center pt-3 pb-10 md:pb-0", children: /* @__PURE__ */ jsxs4("span", { className: "flex items-center gap-2 justify-center", children: [
    hasPrevious && /* @__PURE__ */ jsx8(
      "button",
      {
        onClick: () => onPageChange(page - 1),
        className: "text-text-muted hover:text-text transition-colors",
        "aria-label": "P\xE1gina anterior",
        children: /* @__PURE__ */ jsx8(Lucide.ChevronLeft, {})
      }
    ),
    /* @__PURE__ */ jsxs4("span", { className: "text-text", children: [
      "P\xE1g. ",
      page,
      " / ",
      numPages
    ] }),
    hasNext && /* @__PURE__ */ jsx8(
      "button",
      {
        onClick: () => onPageChange(page + 1),
        className: "text-text-muted hover:text-text transition-colors",
        "aria-label": "Pr\xF3xima p\xE1gina",
        children: /* @__PURE__ */ jsx8(Lucide.ChevronRight, {})
      }
    )
  ] }) });
}

// src/components/Toast/Toast.tsx
import * as Lucide2 from "lucide-react";
import { create } from "zustand";
import { jsx as jsx9, jsxs as jsxs5 } from "react/jsx-runtime";
var useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 5e3);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  }))
}));
var iconMap = {
  success: Lucide2.CheckCircle,
  error: Lucide2.AlertCircle,
  warning: Lucide2.AlertTriangle,
  info: Lucide2.Info
};
var bgMap = {
  success: "bg-green-500/15 border-green-500/30 text-green-400",
  error: "bg-red-500/15 border-red-500/30 text-red-400",
  warning: "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
  info: "bg-primary/15 border-primary/30 text-primary"
};
function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);
  if (toasts.length === 0) return null;
  return /* @__PURE__ */ jsx9("div", { className: "fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none", children: toasts.map((toast) => {
    const Icon = iconMap[toast.type];
    return /* @__PURE__ */ jsxs5(
      "div",
      {
        onClick: () => {
          toast.onClick?.();
          removeToast(toast.id);
        },
        className: `pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-right ${bgMap[toast.type]} ${toast.onClick ? "cursor-pointer" : ""}`,
        children: [
          /* @__PURE__ */ jsx9(Icon, { size: 18, className: "shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsx9("p", { className: "text-sm flex-1", children: toast.message }),
          /* @__PURE__ */ jsx9(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                removeToast(toast.id);
              },
              className: "shrink-0 opacity-60 hover:opacity-100 transition-opacity",
              children: /* @__PURE__ */ jsx9(Lucide2.X, { size: 14 })
            }
          )
        ]
      },
      toast.id
    );
  }) });
}

// src/components/Toggle/Toggle.tsx
import { jsx as jsx10, jsxs as jsxs6 } from "react/jsx-runtime";
function Toggle({ label, checked, onChange, ...props }) {
  return /* @__PURE__ */ jsxs6("label", { className: "flex items-center gap-3 cursor-pointer select-none", children: [
    /* @__PURE__ */ jsxs6("div", { className: "relative", children: [
      /* @__PURE__ */ jsx10(
        "input",
        {
          type: "checkbox",
          checked,
          onChange,
          className: "sr-only peer",
          ...props
        }
      ),
      /* @__PURE__ */ jsx10("div", { className: "w-11 h-6 rounded-full bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 transition-colors duration-200 peer-checked:bg-primary" }),
      /* @__PURE__ */ jsx10("div", { className: "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 peer-checked:translate-x-5" })
    ] }),
    label && /* @__PURE__ */ jsx10("span", { className: "text-sm text-text", children: label })
  ] });
}

// src/components/FullLogo/FullLogo.tsx
import { jsx as jsx11, jsxs as jsxs7 } from "react/jsx-runtime";
function FullLogo({ className }) {
  return /* @__PURE__ */ jsxs7("div", { className: `flex items-center gap-1 ${className ?? ""}`, children: [
    /* @__PURE__ */ jsxs7("div", { className: "relative flex items-center justify-center", children: [
      /* @__PURE__ */ jsx11("div", { className: "absolute inset-0 rounded-full bg-[#2C9ED5]/70 blur-md" }),
      /* @__PURE__ */ jsx11("div", { className: "relative w-4 h-4 rounded-full bg-primary z-10 flex items-center justify-center", children: /* @__PURE__ */ jsx11("span", { className: "text-white text-[8px] font-bold", children: "S" }) })
    ] }),
    /* @__PURE__ */ jsx11("h1", { className: "text-text text-sm font-bold leading-tight tracking-[-0.015em] ml-[3px]", children: "SecureIT" })
  ] });
}
export {
  Badge,
  Button,
  FullLogo,
  Input,
  Loader,
  Modal,
  Pagination,
  Select,
  ShadcnTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ToastContainer,
  Toggle,
  badgeVariants,
  buttonVariants,
  cn,
  colors,
  typography,
  useToastStore
};
