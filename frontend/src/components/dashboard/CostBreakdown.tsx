import { CostEstimateResponse } from "../../types/cost";
import { NODE_LABELS, NODE_COLORS, NodeType } from "../../types/nodes";

interface Props {
  cost: CostEstimateResponse;
}

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export default function CostBreakdown({ cost }: Props) {
  const sorted = [...cost.breakdown].sort((a, b) => b.monthly_usd - a.monthly_usd);
  const max = sorted[0]?.monthly_usd ?? 0;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
          Estimated Monthly Cost
        </h4>
        <span className="text-base font-semibold text-emerald-400">
          {formatUsd(cost.total_monthly_usd)}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {sorted.map((item) => {
          const label = NODE_LABELS[item.type as NodeType] ?? item.type;
          const color = NODE_COLORS[item.type as NodeType] ?? "#6b7280";
          const pct = max > 0 ? (item.monthly_usd / max) * 100 : 0;

          return (
            <div key={item.node_id}>
              <div className="flex items-center justify-between text-[11px] mb-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-300 truncate">{label}</span>
                  <span className="text-gray-600 text-[10px] truncate">
                    {item.resource}
                    {item.instances > 1 && ` ×${item.instances}`}
                  </span>
                </div>
                <span className="font-mono text-gray-300 shrink-0 ml-2">
                  {formatUsd(item.monthly_usd)}
                </span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: color, opacity: 0.7 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-600 mt-2 leading-relaxed italic">
        {cost.disclaimer}
      </p>
    </div>
  );
}
