import { NodeResult } from "../../types/simulation";
import { NODE_LABELS, NodeType } from "../../types/nodes";

interface Props {
  nodes: NodeResult[];
}

function utilizationColor(pct: number): string {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 80) return "bg-amber-500";
  if (pct >= 60) return "bg-yellow-500";
  return "bg-green-500";
}

function utilizationTextColor(pct: number): string {
  if (pct >= 100) return "text-red-400";
  if (pct >= 80) return "text-amber-400";
  return "text-gray-400";
}

export default function UtilizationBars({ nodes }: Props) {
  const filtered = nodes.filter((n) => n.type !== "client");

  if (filtered.length === 0) return null;

  return (
    <div>
      <h4 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
        Utilization per Node
      </h4>
      <div className="flex flex-col gap-2">
        {filtered.map((n) => {
          const pct = n.utilization_percent;
          const barWidth = Math.min(pct, 100);
          const label = NODE_LABELS[n.type as NodeType] ?? n.type;

          return (
            <div key={n.id}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] text-gray-300">{label}</span>
                <span className={`text-[11px] font-mono font-medium ${utilizationTextColor(pct)}`}>
                  {pct.toFixed(0)}%
                  {pct >= 100 && " (saturated)"}
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${utilizationColor(pct)}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
