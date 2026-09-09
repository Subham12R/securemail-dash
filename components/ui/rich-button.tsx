import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

export type RichButtonColor =
  | "default"
  | "primary"
  | "danger"
  | "warning"
  | "info";
export type RichButtonSize = "default" | "sm" | "lg" | "icon";

export interface RichButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  color?: RichButtonColor;
  size?: RichButtonSize;
  asChild?: boolean;
}

const colorClasses: Record<RichButtonColor, string> = {
  default:
    "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900",
  primary: "border-green-600 bg-green-600 text-white hover:bg-green-700",
  danger: "border-red-200 bg-red-500 text-white hover:bg-red-600",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800",
  info:
    "border-blue-900 bg-blue-900 text-white hover:bg-blue-950 hover:shadow-[0_6px_16px_-4px_rgb(30_58_138/0.4)]",
};

const sizeClasses: Record<RichButtonSize, string> = {
  default: "h-9 px-3",
  sm: "h-8 px-2.5 text-xs",
  lg: "h-10 px-4",
  icon: "size-9",
};

export const RichButton = forwardRef<HTMLButtonElement, RichButtonProps>(
  function RichButton(
    {
      asChild = false,
      children,
      className,
      color = "default",
      size = "default",
      ...props
    },
    ref,
  ) {
    const classes = [
      "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:pointer-events-none disabled:opacity-50",
      colorClasses[color],
      sizeClasses[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{ className?: string }>;

      return cloneElement(child, {
        ...props,
        className: [classes, child.props.className].filter(Boolean).join(" "),
      } as Partial<typeof child.props>);
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  },
);

RichButton.displayName = "RichButton";
