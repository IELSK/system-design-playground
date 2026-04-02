import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeData, NODE_COLORS } from "../../types/nodes";

export default function ArchitectureNode({ data, selected }: NodeProps & { data: NodeData }) {
  const color = NODE_COLORS[data.nodeType];

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-gray-900 min-w-[140px] text-center transition-shadow ${
        selected ? "shadow-lg shadow-white/10" : ""
      }`}
      style={{ borderColor: selected ? color : `${color}88` }}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-500 !w-2.5 !h-2.5" />

      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color }}>
        {data.nodeType.replace("_", " ")}
      </div>
      <div className="text-sm font-medium text-gray-100">{data.label}</div>

      <Handle type="source" position={Position.Right} className="!bg-gray-500 !w-2.5 !h-2.5" />
    </div>
  );
}
