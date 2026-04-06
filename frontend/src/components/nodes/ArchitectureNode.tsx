import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeData, NODE_COLORS } from "../../types/nodes";

export default function ArchitectureNode({ data, selected }: NodeProps & { data: NodeData }) {
  const color = NODE_COLORS[data.nodeType];
  const isBottleneck = data.bottleneck === true;

  const borderColor = isBottleneck ? "#ef4444" : selected ? color : `${color}88`;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-gray-900 min-w-[140px] text-center transition-shadow ${
        selected ? "shadow-lg shadow-white/10" : ""
      } ${isBottleneck ? "animate-pulse shadow-lg shadow-red-500/30" : ""}`}
      style={{ borderColor }}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-500 !w-2.5 !h-2.5" />

      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: isBottleneck ? "#ef4444" : color }}>
        {data.nodeType.replace("_", " ")}
        {isBottleneck && " ⚠"}
      </div>
      <div className="text-sm font-medium text-gray-100">{data.label}</div>

      <Handle type="source" position={Position.Right} className="!bg-gray-500 !w-2.5 !h-2.5" />
    </div>
  );
}
