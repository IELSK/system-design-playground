import { Node } from "@xyflow/react";
import { NodeData, NodeConfig } from "../../types/nodes";

interface Props {
  node: Node<NodeData>;
  onChange: (nodeId: string, config: NodeConfig) => void;
  onClose: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  rps: "Requests per second",
  instances: "Instances",
  overhead_ms: "Overhead (ms)",
  processing_ms: "Processing time (ms)",
  max_rps_per_instance: "Max RPS per instance",
  capacity: "Queue capacity",
  workers: "Workers",
  concurrency: "Concurrency",
  read_latency_ms: "Read latency (ms)",
  write_latency_ms: "Write latency (ms)",
  max_connections: "Max connections",
  hit_rate: "Hit rate (0-1)",
};

export default function ConfigPanel({ node, onChange, onClose }: Props) {
  const config = node.data.config;
  const entries = Object.entries(config) as [string, number][];

  function handleChange(key: string, value: string) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;

    // Clamp hit_rate to 0-1
    const clamped = key === "hit_rate" ? Math.min(num, 1) : num;

    onChange(node.id, { ...config, [key]: clamped });
  }

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        onClick={onClose}
        className="md:hidden fixed inset-0 z-10 bg-black/50"
      />

      <div className="fixed md:static right-0 top-0 h-full z-20 w-64 bg-gray-900 border-l border-gray-800 p-4 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200">{node.data.label}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none">
            ×
          </button>
        </div>

      <div className="flex flex-col gap-3">
        {entries.map(([key, value]) => (
          <div key={key}>
            <label className="block text-xs text-gray-400 mb-1">
              {FIELD_LABELS[key] || key}
            </label>
            <input
              type="number"
              value={value}
              min={0}
              max={key === "hit_rate" ? 1 : undefined}
              step={key === "hit_rate" ? 0.05 : 1}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        ))}
      </div>
    </div>
    </>
  );
}