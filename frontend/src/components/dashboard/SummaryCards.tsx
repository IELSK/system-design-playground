import { SimulationResponse } from "../../types/simulation";
import { NODE_LABELS, NodeType } from "../../types/nodes";

interface Props {
  result: SimulationResponse;
}

interface CardDef {
  label: string;
  value: string;
  sub?: string;
  color: string;
}

export default function SummaryCards({ result }: Props) {
  const { summary } = result;

  const bottleneckLabel = summary.bottleneck_node_id
    ? (() => {
        const node = result.nodes.find((n) => n.id === summary.bottleneck_node_id);
        const type = node?.type as NodeType | undefined;
        return type ? NODE_LABELS[type] : summary.bottleneck_node_id;
      })()
    : "None";

  const cards: CardDef[] = [
    {
      label: "Total Latency",
      value: `${summary.total_latency_ms.toFixed(1)} ms`,
      color: "text-blue-400",
    },
    {
      label: "Throughput",
      value: `${summary.throughput_rps.toLocaleString()} rps`,
      color: "text-green-400",
    },
    {
      label: "Error Rate",
      value: `${summary.error_rate_percent.toFixed(1)}%`,
      color: summary.error_rate_percent > 0 ? "text-red-400" : "text-green-400",
    },
    {
      label: "Bottleneck",
      value: bottleneckLabel,
      color: summary.bottleneck_node_id ? "text-amber-400" : "text-green-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2.5"
        >
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
            {c.label}
          </div>
          <div className={`text-base font-semibold mt-0.5 ${c.color}`}>
            {c.value}
          </div>
          {c.sub && (
            <div className="text-[10px] text-gray-500 mt-0.5 font-mono">{c.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}
