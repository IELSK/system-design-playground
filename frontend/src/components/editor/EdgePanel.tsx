import { Edge } from "@xyflow/react";

interface Props {
  edge: Edge;
  siblings: Edge[];
  onChange: (edgeId: string, weight: number) => void;
  onDelete: (edgeId: string) => void;
  onClose: () => void;
}

export default function EdgePanel({
  edge,
  siblings,
  onChange,
  onDelete,
  onClose,
}: Props) {
  const hasBranch = siblings.length > 1;

  const totalWeight = siblings.reduce(
    (sum, e) => sum + ((e.data?.weight as number | undefined) ?? 0),
    0,
  );
  const currentWeight = (edge.data?.weight as number | undefined) ?? 0;
  const percent =
    hasBranch && totalWeight > 0
      ? Math.round((currentWeight / totalWeight) * 100)
      : hasBranch
        ? Math.round(100 / siblings.length)
        : 100;

  return (
    <>
      <div
        onClick={onClose}
        className="md:hidden fixed inset-0 z-10 bg-black/50"
      />
      <div className="fixed md:static right-0 top-0 h-full z-20 w-64 bg-gray-900 border-l border-gray-800 p-4 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200">Edge</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="text-[11px] text-gray-500 mb-3 font-mono break-all">
          {edge.source} → {edge.target}
        </div>

        {hasBranch ? (
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1">
              Traffic split: {percent}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={percent}
              onChange={(e) => onChange(edge.id, parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500"
            />
            <p className="text-[10px] text-gray-600 mt-2 italic leading-relaxed">
              Source has {siblings.length} outgoing edges. Weights are
              normalized across siblings.
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-gray-600 mb-4 italic">
            Single outgoing edge — receives 100% of upstream traffic. Connect
            another edge to the same source to enable branching.
          </p>
        )}

        <button
          onClick={() => onDelete(edge.id)}
          className="mt-auto px-3 py-1.5 text-xs font-medium rounded border border-red-900 bg-red-950/50 text-red-400 hover:bg-red-900/50 transition-colors"
        >
          Delete edge
        </button>
      </div>
    </>
  );
}
