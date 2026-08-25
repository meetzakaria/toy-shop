import { Star } from "@/components/icons";

export function Rating({
  value,
  reviews,
  size = "sm",
}: {
  value: number;
  reviews?: number;
  size?: "sm" | "md";
}) {
  const dimension = size === "md" ? "h-4.5 w-4.5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex text-star"
        role="img"
        aria-label={`Rated ${value} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((step) => (
          <Star
            key={step}
            filled={value >= step - 0.25}
            className={`${dimension} ${value >= step - 0.25 ? "" : "text-line"}`}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className={size === "md" ? "text-sm text-muted" : "text-xs text-muted"}>
        {value.toFixed(1)}
        {reviews !== undefined && ` (${reviews})`}
      </span>
    </div>
  );
}
