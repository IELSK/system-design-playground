import { NodeResult, FailureType } from "../../types/simulation";
import { NODE_LABELS, NodeType } from "../../types/nodes";

interface Props {
  nodes: NodeResult[];
}

const FAILURE_LABELS: Record<FailureType, string> = {
  node_down: "down",
  slow_response: "slow",
  partial_failure: "errors",
  capacity_degraded: "degraded",
};

export default function NodeDetailTable({ nodes }: Props) {
  const filtered = nodes.filter((n) => n.type !== "client");

  if (filtered.length === 0) return null;

  // Detect duplicate types so we can append a suffix to disambiguate
  const typeCounts: Record<string, number> = {};
  for (const n of filtered) typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;

  return (
    <div>
      <h4 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
        Node Details
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="text-left py-1.5 pr-2 font-medium">Node</th>
              <th className="text-right py-1.5 px-2 font-medium">Capacity</th>
              <th className="text-right py-1.5 px-2 font-medium">Effective</th>
              <th className="text-right py-1.5 px-2 font-medium">Util %</th>
              <th className="text-right py-1.5 pl-2 font-medium">Latency</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((n) => (
              <tr
                key={n.id}
                className={`border-b border-gray-800/50 ${n.is_bottleneck ? "text-red-400" : "text-gray-300"}`}
              >
                <td className="py-1.5 pr-2 font-medium">
                  {NODE_LABELS[n.type as NodeType] ?? n.type}
                  {typeCounts[n.type] > 1 && (
                    <span className="text-gray-600 font-mono text-[9px] ml-1">
                      {n.id}
                    </span>
                  )}
                  {n.is_bottleneck && " !!"}
                  {n.failure_mode && (
                    <span className="ml-1.5 px-1 py-px text-[9px] uppercase tracking-wide rounded bg-amber-900/40 text-amber-400 border border-amber-800/60 font-normal">
                      {FAILURE_LABELS[n.failure_mode]}
                    </span>
                  )}
                </td>
                <td className="text-right py-1.5 px-2 font-mono">
                  {n.capacity_rps.toLocaleString()}
                </td>
                <td className="text-right py-1.5 px-2 font-mono">
                  {n.effective_rps.toLocaleString()}
                </td>
                <td className="text-right py-1.5 px-2 font-mono">
                  {n.utilization_percent.toFixed(0)}%
                </td>
                <td className="text-right py-1.5 pl-2 font-mono">
                  {(n.latency_contribution_ms + n.queue_wait_ms).toFixed(1)} ms
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
