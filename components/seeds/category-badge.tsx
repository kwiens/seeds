import { categories, type CategoryKey } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function CategoryBadge({
  category,
  className,
}: {
  category: CategoryKey;
  className?: string;
}) {
  const info = categories[category];
  const Icon = info.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        info.bgClass,
        info.textClass,
        className,
      )}
    >
      <Icon className="size-3" />
      {info.label}
    </span>
  );
}
