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
    "border-black/10 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 hover:text-zinc-900",
  primary:
    "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800",
  danger:
    "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800",
  warning:
    "border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 hover:text-zinc-900",
  info:
    "border-zinc-300 bg-zinc-200 text-zinc-800 hover:bg-zinc-300 hover:text-zinc-900",
};

const sizeClasses: Record<RichButtonSize, string> = {
  default: "h-9 px-4",
  sm: "h-8 px-3 text-xs",
  lg: "h-10 px-5",
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
      "inline-flex items-center justify-center gap-2 rounded-full border text-sm font-normal transition-[background-color,border-color,color,transform] duration-150 ease-out motion-safe:active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:pointer-events-none disabled:opacity-50",
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
