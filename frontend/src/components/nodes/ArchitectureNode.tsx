import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeData, NODE_COLORS } from "../../types/nodes";

const FAILURE_BADGE: Record<string, string> = {
  node_down: "DOWN",
  slow_response: "SLOW",
  partial_failure: "ERRORS",
  capacity_degraded: "DEGRADED",
};

export default function ArchitectureNode({ data, selected }: NodeProps & { data: NodeData }) {
  const color = NODE_COLORS[data.nodeType];
  const isBottleneck = data.bottleneck === true;
  const hasFailure = !!data.failureMode;

  const borderColor = isBottleneck
    ? "#ef4444"
    : hasFailure
      ? "#f59e0b"
      : selected
        ? color
        : `${color}88`;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-gray-900 min-w-[140px] text-center transition-shadow ${
        selected ? "shadow-lg shadow-white/10" : ""
      } ${isBottleneck ? "animate-pulse shadow-lg shadow-red-500/30" : ""} ${
        hasFailure && !isBottleneck ? "shadow-md shadow-amber-500/20" : ""
      }`}
      style={{ borderColor }}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-500 !w-2.5 !h-2.5" />

      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: isBottleneck ? "#ef4444" : hasFailure ? "#f59e0b" : color }}>
        {data.nodeType.replace("_", " ")}
        {isBottleneck && " ⚠"}
      </div>
      <div className="text-sm font-medium text-gray-100">{data.label}</div>

      {hasFailure && (
        <div className="mt-1 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-amber-900/50 text-amber-400 border border-amber-800/60 inline-block">
          {FAILURE_BADGE[data.failureMode!] ?? data.failureMode}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-gray-500 !w-2.5 !h-2.5" />
    </div>
  );
}
