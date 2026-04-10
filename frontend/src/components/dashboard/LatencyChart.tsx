import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { NodeResult } from "../../types/simulation";
import { NODE_LABELS, NODE_COLORS, NodeType } from "../../types/nodes";

interface Props {
  nodes: NodeResult[];
}

export default function LatencyChart({ nodes }: Props) {
  const data = nodes
    .filter((n) => n.type !== "client")
    .map((n) => ({
      name: NODE_LABELS[n.type as NodeType] ?? n.type,
      processing: n.latency_contribution_ms,
      queue: n.queue_wait_ms,
      total: n.latency_contribution_ms + n.queue_wait_ms,
      color: NODE_COLORS[n.type as NodeType] ?? "#6b7280",
      isBottleneck: n.is_bottleneck,
    }));

  if (data.length === 0) return null;

  return (
    <div>
      <h4 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
        Latency Breakdown by Node
      </h4>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickFormatter={(v) => `${v}ms`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            width={80}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 8,
              fontSize: 11,
              color: "#d1d5db",
            }}
            labelStyle={{ color: "#9ca3af", fontWeight: 500, fontSize: 10 }}
            itemStyle={{ color: "#d1d5db" }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)} ms`,
              name === "processing" ? "Processing" : "Queue Wait",
            ]}
          />
          <Bar dataKey="processing" stackId="latency" radius={[0, 0, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
          <Bar dataKey="queue" stackId="latency" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.isBottleneck ? "#ef4444" : entry.color} fillOpacity={0.45} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
