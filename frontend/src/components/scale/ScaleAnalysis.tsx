import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  CartesianGrid,
} from "recharts";
import { Node } from "@xyflow/react";
import { SimulationResponse, ScalePoint } from "../../types/simulation";
import { CostEstimateResponse } from "../../types/cost";
import { NodeData, NODE_LABELS, NodeType } from "../../types/nodes";

interface Props {
  result: SimulationResponse;
  cost: CostEstimateResponse | null;
  nodes: Node<NodeData>[];
  onClose: () => void;
}

const tooltipStyle = {
  background: "#1f2937",
  border: "1px solid #374151",
  borderRadius: 8,
  fontSize: 11,
  color: "#d1d5db",
};

function formatTraffic(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return `${v}`;
}

function nodeLabel(
  id: string | null,
  nodes: Node<NodeData>[],
): string {
  if (!id) return "—";
  const n = nodes.find((x) => x.id === id);
  if (!n) return id;
  return NODE_LABELS[n.data.nodeType as NodeType] ?? n.data.nodeType;
}

function buildRecommendations(
  scale: ScalePoint[],
  nodes: Node<NodeData>[],
): string[] {
  const recs: string[] = [];

  // First traffic level where throughput drops below requested (saturation starts)
  const firstSaturated = scale.find((p) => p.error_rate_percent > 1);
  if (firstSaturated) {
    const bn = nodeLabel(firstSaturated.bottleneck, nodes);
    recs.push(
      `Saturation begins around ${formatTraffic(firstSaturated.traffic_rps)} rps — bottleneck: ${bn}. Scale it horizontally or raise per-instance capacity.`,
    );
  } else {
    recs.push(
      `System handles all tested traffic levels without saturation (up to ${formatTraffic(scale[scale.length - 1].traffic_rps)} rps).`,
    );
  }

  // Bottleneck change between points → suggests asymmetric scaling
  const distinctBottlenecks = Array.from(
    new Set(scale.map((p) => p.bottleneck).filter(Boolean)),
  );
  if (distinctBottlenecks.length > 1) {
    const labels = distinctBottlenecks
      .map((id) => nodeLabel(id, nodes))
      .join(", ");
    recs.push(
      `Bottleneck shifts across scale levels (${labels}). Plan scaling incrementally, not just the first saturated node.`,
    );
  }

  // High latency at low traffic → processing time dominated, not queue
  const lowTraffic = scale[0];
  if (lowTraffic && lowTraffic.latency_ms > 200) {
    recs.push(
      `Baseline latency is already ${lowTraffic.latency_ms.toFixed(0)} ms at ${formatTraffic(lowTraffic.traffic_rps)} rps — review per-node processing time before adding capacity.`,
    );
  }

  // Latency explosion heuristic: last / first ratio
  const last = scale[scale.length - 1];
  if (lowTraffic && last && last.latency_ms > lowTraffic.latency_ms * 10) {
    recs.push(
      `Latency grows ${(last.latency_ms / lowTraffic.latency_ms).toFixed(0)}× from low to high traffic — queue waits dominate, indicating insufficient parallelism.`,
    );
  }

  return recs;
}

export default function ScaleAnalysis({ result, cost, nodes, onClose }: Props) {
  const scale = result.scale_projection;

  const [sliderIdx, setSliderIdx] = useState(scale.length - 1);

  // Cost per 1M successful requests at each traffic level
  const costPerMillion = useMemo(() => {
    if (!cost) return null;
    const monthlySeconds = 30 * 24 * 3600;
    const costPerSec = cost.total_monthly_usd / monthlySeconds;
    return scale.map((p) => ({
      traffic_rps: p.traffic_rps,
      usd_per_million:
        p.throughput_rps > 0 ? (costPerSec / p.throughput_rps) * 1_000_000 : 0,
    }));
  }, [cost, scale]);

  const selected = scale[sliderIdx];
  const recommendations = useMemo(
    () => buildRecommendations(scale, nodes),
    [scale, nodes],
  );

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-800 px-5 py-3 bg-gray-900">
        <div>
          <h2 className="text-sm font-semibold text-gray-100">
            Scale Analysis
          </h2>
          <p className="text-[11px] text-gray-500">
            System behavior projected across traffic levels
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Interactive slider */}
        <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Traffic Explorer
            </h3>
            <span className="text-[11px] text-gray-500 font-mono">
              {formatTraffic(selected.traffic_rps)} rps
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={scale.length - 1}
            step={1}
            value={sliderIdx}
            onChange={(e) => setSliderIdx(parseInt(e.target.value, 10))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-gray-600 font-mono mt-1">
            {scale.map((p, i) => (
              <span
                key={p.traffic_rps}
                className={i === sliderIdx ? "text-indigo-400 font-semibold" : ""}
              >
                {formatTraffic(p.traffic_rps)}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-[11px]">
            <div className="bg-gray-950/60 border border-gray-800 rounded p-2">
              <div className="text-[10px] text-gray-500 uppercase">Latency</div>
              <div className="text-gray-100 font-semibold font-mono">
                {selected.latency_ms.toFixed(1)} ms
              </div>
            </div>
            <div className="bg-gray-950/60 border border-gray-800 rounded p-2">
              <div className="text-[10px] text-gray-500 uppercase">
                Throughput
              </div>
              <div className="text-gray-100 font-semibold font-mono">
                {selected.throughput_rps.toLocaleString()} rps
              </div>
            </div>
            <div className="bg-gray-950/60 border border-gray-800 rounded p-2">
              <div className="text-[10px] text-gray-500 uppercase">
                Error rate
              </div>
              <div
                className={`font-semibold font-mono ${selected.error_rate_percent > 5 ? "text-red-400" : "text-gray-100"}`}
              >
                {selected.error_rate_percent.toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-950/60 border border-gray-800 rounded p-2">
              <div className="text-[10px] text-gray-500 uppercase">
                Bottleneck
              </div>
              <div className="text-gray-100 font-semibold">
                {nodeLabel(selected.bottleneck, nodes)}
              </div>
            </div>
          </div>
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Latency vs Traffic"
            data={scale}
            dataKey="latency_ms"
            color="#6366f1"
            unit="ms"
            highlight={{
              traffic_rps: selected.traffic_rps,
              value: selected.latency_ms,
            }}
          />
          <ChartCard
            title="Throughput vs Traffic"
            data={scale}
            dataKey="throughput_rps"
            color="#10b981"
            unit="rps"
            highlight={{
              traffic_rps: selected.traffic_rps,
              value: selected.throughput_rps,
            }}
          />
          <ChartCard
            title="Error Rate vs Traffic"
            data={scale}
            dataKey="error_rate_percent"
            color="#ef4444"
            unit="%"
            highlight={{
              traffic_rps: selected.traffic_rps,
              value: selected.error_rate_percent,
            }}
          />
          {costPerMillion && (
            <ChartCard
              title="Cost per 1M Requests"
              data={costPerMillion}
              dataKey="usd_per_million"
              color="#f59e0b"
              unit="USD"
              highlight={{
                traffic_rps: selected.traffic_rps,
                value:
                  costPerMillion.find(
                    (c) => c.traffic_rps === selected.traffic_rps,
                  )?.usd_per_million ?? 0,
              }}
            />
          )}
        </div>

        {/* Bottleneck timeline */}
        <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/40">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
            Bottleneck Timeline
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-1.5 pr-2 font-medium">Traffic</th>
                  <th className="text-left py-1.5 px-2 font-medium">
                    Bottleneck
                  </th>
                  <th className="text-right py-1.5 px-2 font-medium">
                    Latency
                  </th>
                  <th className="text-right py-1.5 px-2 font-medium">
                    Throughput
                  </th>
                  <th className="text-right py-1.5 pl-2 font-medium">
                    Error %
                  </th>
                </tr>
              </thead>
              <tbody>
                {scale.map((p) => {
                  const saturated = p.error_rate_percent > 1;
                  return (
                    <tr
                      key={p.traffic_rps}
                      className={`border-b border-gray-800/50 ${saturated ? "text-red-400" : "text-gray-300"}`}
                    >
                      <td className="py-1.5 pr-2 font-mono">
                        {formatTraffic(p.traffic_rps)} rps
                      </td>
                      <td className="py-1.5 px-2">
                        {nodeLabel(p.bottleneck, nodes)}
                      </td>
                      <td className="text-right py-1.5 px-2 font-mono">
                        {p.latency_ms.toFixed(1)} ms
                      </td>
                      <td className="text-right py-1.5 px-2 font-mono">
                        {p.throughput_rps.toLocaleString()}
                      </td>
                      <td className="text-right py-1.5 pl-2 font-mono">
                        {p.error_rate_percent.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendations */}
        <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/40">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Recommendations
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li
                key={i}
                className="text-[12px] text-gray-300 leading-relaxed pl-3 border-l-2 border-indigo-700/50"
              >
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  data: object[];
  dataKey: string;
  color: string;
  unit: string;
  highlight: { traffic_rps: number; value: number };
}

function ChartCard({
  title,
  data,
  dataKey,
  color,
  unit,
  highlight,
}: ChartCardProps) {
  return (
    <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/40">
      <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
        >
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
          <XAxis
            dataKey="traffic_rps"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickFormatter={formatTraffic}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickFormatter={(v) =>
              unit === "USD"
                ? `$${v.toFixed(2)}`
                : unit === "rps"
                  ? formatTraffic(v)
                  : `${v.toFixed(0)}`
            }
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(v) => `${formatTraffic(Number(v))} rps`}
            formatter={(value: number) => [
              unit === "USD"
                ? `$${value.toFixed(4)}`
                : `${value.toFixed(2)} ${unit}`,
              title,
            ]}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3 }}
            activeDot={{ r: 5 }}
          />
          <ReferenceDot
            x={highlight.traffic_rps}
            y={highlight.value}
            r={6}
            fill={color}
            stroke="#fff"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
