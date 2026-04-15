interface Props {
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onSimulate: () => void;
  onToggleFailures: () => void;
  failureCount: number;
  simulating?: boolean;
}

export default function Toolbar({
  onSave,
  onLoad,
  onClear,
  onZoomIn,
  onZoomOut,
  onFitView,
  onSimulate,
  onToggleFailures,
  failureCount,
  simulating = false,
}: Props) {
  const btn = "px-3 py-1.5 text-xs font-medium rounded border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-gray-100 transition-colors";

  return (
    <div className="flex items-center gap-2 bg-gray-900 border-b border-gray-800 px-2 py-2 overflow-x-auto min-w-0">
      <button onClick={onSave} className={btn}>Save</button>
      <button onClick={onLoad} className={btn}>Load</button>
      <button onClick={onClear} className={btn}>Clear</button>

      <div className="w-px h-5 bg-gray-700 shrink-0" />

      <button onClick={onZoomIn} className={btn}>+</button>
      <button onClick={onZoomOut} className={btn}>−</button>
      <button onClick={onFitView} className={btn}>Fit</button>

      <div className="flex-1 min-w-[6px]" />

      <button
        onClick={onToggleFailures}
        className={`${btn} ${failureCount > 0 ? "border-amber-700 text-amber-400" : ""}`}
      >
        Failures{failureCount > 0 ? ` (${failureCount})` : ""}
      </button>

      <button
        onClick={onSimulate}
        disabled={simulating}
        className="px-3 py-1.5 text-xs font-semibold rounded bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {simulating ? "Simulating..." : "Simulate →"}
      </button>
    </div>
  );
}