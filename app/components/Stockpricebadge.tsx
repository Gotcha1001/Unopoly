"use client";
export function StockPriceBadge({
  price,
  pctChange,
}: {
  price: number;
  pctChange?: number;
}) {
  const up = (pctChange ?? 0) >= 0;
  return (
    <span className="flex items-center gap-1.5 font-mono text-sm">
      <span className="text-[#F2ECDD]">${price.toLocaleString()}</span>
      {typeof pctChange === "number" && (
        <span className={up ? "text-emerald-400" : "text-red-400"}>
          {up ? "▲" : "▼"} {Math.abs(pctChange).toFixed(1)}%
        </span>
      )}
    </span>
  );
}
