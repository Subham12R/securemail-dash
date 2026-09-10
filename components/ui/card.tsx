import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetricCardProps = HTMLAttributes<HTMLElement> & {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  valueClassName?: string;
};

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  iconClassName,
  valueClassName,
  className,
  ...props
}: MetricCardProps) {
  return (
    <article
      className={cn(
        "group rounded-xl border border-black/10 bg-white p-[18px] shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-normal tracking-tight text-zinc-600 transition-colors group-hover:text-zinc-900">
          {label}
        </p>
        {Icon ? (
          <Icon
            aria-hidden="true"
            className={cn("size-4 shrink-0", iconClassName)}
          />
        ) : null}
      </div>
      <p className={cn("mt-4 text-4xl font-normal tracking-tight text-zinc-900", valueClassName)}>
        {value}
      </p>
      {description !== undefined ? (
        <p className="mt-1 text-xs tracking-tighter text-zinc-500">{description}</p>
      ) : null}
    </article>
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-black/10 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.05)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col p-[18px]", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-medium tracking-tighter text-zinc-900", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-zinc-500", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-[18px] pb-[18px]", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-[18px] pb-[18px]", className)} {...props} />;
}
