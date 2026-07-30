import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  children: ReactNode;
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-systemBlue/70 bg-systemBlue text-abyss shadow-system hover:border-systemCyan hover:bg-systemCyan",
  secondary:
    "border-systemBlue/40 bg-panel/70 text-slate-100 shadow-[inset_0_0_20px_rgba(233,91,255,0.06)] hover:border-systemBlue hover:text-systemCyan hover:shadow-system",
  ghost: "border-transparent bg-transparent text-slate-300 hover:bg-systemBlue/10 hover:text-systemCyan"
};

export function Button({
  asChild = false,
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  const classes = [
    "inline-flex h-10 items-center justify-center rounded-sm border px-3.5 text-xs font-semibold uppercase tracking-[0.08em] transition",
    "focus:outline-none focus:ring-2 focus:ring-systemCyan focus:ring-offset-2 focus:ring-offset-abyss",
    variants[variant],
    className
  ]
    .filter(Boolean)
    .join(" ");

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      className: [classes, child.props.className].filter(Boolean).join(" ")
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
