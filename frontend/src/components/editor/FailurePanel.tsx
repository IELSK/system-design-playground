import { Node } from "@xyflow/react";
import { NodeData, NODE_LABELS, NodeType } from "../../types/nodes";
import { Failure, FailureType } from "../../types/simulation";

interface Props {
  nodes: Node<NodeData>[];
  failures: Failure[];
  onChange: (failures: Failure[]) => void;
  onClose: () => void;
}

const FAILURE_OPTIONS: { value: FailureType | "none"; label: string }[] = [
  { value: "none", label: "None" },
  { value: "node_down", label: "Node down" },
  { value: "slow_response", label: "Slow response" },
  { value: "partial_failure", label: "Partial failure" },
  { value: "capacity_degraded", label: "Capacity degraded" },
];

export default function FailurePanel({
  nodes,
  failures,
  onChange,
  onClose,
}: Props) {
  const eligible = nodes.filter((n) => n.data.nodeType !== "client");

  function update(nodeId: string, patch: Partial<Failure> | null) {
    const next = failures.filter((f) => f.node_id !== nodeId);
    if (patch) {
      const existing = failures.find((f) => f.node_id === nodeId);
      next.push({
        node_id: nodeId,
        type: (patch.type ?? existing?.type ?? "node_down") as FailureType,
        factor: patch.factor ?? existing?.factor,
        percent: patch.percent ?? existing?.percent,
        error_percent: patch.error_percent ?? existing?.error_percent,
      });
    }
    onChange(next);
  }

  return (
    <>
      <div
        onClick={onClose}
        className="md:hidden fixed inset-0 z-10 bg-black/50"
      />
      <div className="fixed md:static right-0 top-0 h-full z-20 w-72 bg-gray-900 border-l border-gray-800 p-4 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200">
            Failure Modes
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {eligible.length === 0 && (
          <p className="text-xs text-gray-500 italic">No nodes to configure.</p>
        )}

        <div className="flex flex-col gap-4">
          {eligible.map((node) => {
            const failure = failures.find((f) => f.node_id === node.id);
            const label = NODE_LABELS[node.data.nodeType as NodeType];
            const currentType = failure?.type ?? "none";

            return (
              <div
                key={node.id}
                className="border border-gray-800 rounded p-2.5 bg-gray-950/40"
              >
                <div className="text-xs font-medium text-gray-300 mb-1.5">
                  {label}
                  <span className="text-gray-600 font-mono ml-1 text-[10px]">
                    {node.id}
                  </span>
                </div>

                <select
                  value={currentType}
                  onChange={(e) => {
                    const v = e.target.value as FailureType | "none";
                    if (v === "none") update(node.id, null);
                    else update(node.id, { type: v });
                  }}
                  className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {FAILURE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {failure?.type === "slow_response" && (
                  <div className="mt-2">
                    <label className="block text-[10px] text-gray-500 mb-1">
                      Latency factor ×
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={0.5}
                      value={failure.factor ?? 3}
                      onChange={(e) =>
                        update(node.id, {
                          factor: parseFloat(e.target.value) || 3,
                        })
                      }
                      className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {failure?.type === "partial_failure" && (
                  <div className="mt-2">
                    <label className="block text-[10px] text-gray-500 mb-1">
                      Error percent (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={5}
                      value={failure.error_percent ?? 10}
                      onChange={(e) =>
                        update(node.id, {
                          error_percent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {failure?.type === "capacity_degraded" && (
                  <div className="mt-2">
                    <label className="block text-[10px] text-gray-500 mb-1">
                      Capacity reduction (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={5}
                      value={failure.percent ?? 50}
                      onChange={(e) =>
                        update(node.id, {
                          percent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {failures.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="mt-4 px-3 py-1.5 text-xs font-medium rounded border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
          >
            Clear all failures
          </button>
        )}
      </div>
    </>
  );
}
