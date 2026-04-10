import { NodeResult } from "../../types/simulation";
import { NODE_LABELS, NodeType } from "../../types/nodes";

interface Props {
  nodes: NodeResult[];
}

export default function NodeDetailTable({ nodes }: Props) {
  const filtered = nodes.filter((n) => n.type !== "client");

  if (filtered.length === 0) return null;

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
                  {n.is_bottleneck && " !!"}
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
