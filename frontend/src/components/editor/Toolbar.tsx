interface Props {
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onSimulate: () => void;
  onToggleFailures: () => void;
  onOpenScale: () => void;
  scaleAvailable: boolean;
  onCloudSave: () => void;
  onCloudUpdate?: () => void;
  onMyArchitectures: () => void;
  onShare?: () => void;
  failureCount: number;
  simulating?: boolean;
  currentArchName?: string | null;
  currentArchIsPublic?: boolean;
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
  onOpenScale,
  scaleAvailable,
  onCloudSave,
  onCloudUpdate,
  onMyArchitectures,
  onShare,
  failureCount,
  simulating = false,
  currentArchName,
  currentArchIsPublic,
}: Props) {
  const btn = "px-3 py-1.5 text-xs font-medium rounded border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-gray-100 transition-colors";

  return (
    <div className="flex items-center gap-2 bg-gray-900 border-b border-gray-800 px-2 py-2 overflow-x-auto min-w-0">
      <button onClick={onSave} className={btn} title="Save to browser">Save</button>
      <button onClick={onLoad} className={btn} title="Load from browser">Load</button>
      <button onClick={onClear} className={btn}>Clear</button>

      <div className="w-px h-5 bg-gray-700 shrink-0" />

      <button onClick={onCloudSave} className={btn} title="Save to cloud">
        ☁ Save
      </button>
      {currentArchName && onCloudUpdate && (
        <button onClick={onCloudUpdate} className={btn} title="Update cloud copy">
          Update
        </button>
      )}
      {currentArchName && currentArchIsPublic && onShare && (
        <button onClick={onShare} className={btn} title="Copy share link">
          Share
        </button>
      )}
      <button onClick={onMyArchitectures} className={btn}>
        Mine
      </button>

      <div className="w-px h-5 bg-gray-700 shrink-0" />

      <button onClick={onZoomIn} className={btn}>+</button>
      <button onClick={onZoomOut} className={btn}>−</button>
      <button onClick={onFitView} className={btn}>Fit</button>

      {currentArchName && (
        <div className="ml-2 flex items-center gap-1.5 text-[11px] text-gray-400 truncate max-w-[200px]">
          <span className="text-gray-600">·</span>
          <span className="truncate">{currentArchName}</span>
          {currentArchIsPublic && (
            <span className="shrink-0 px-1 py-px text-[9px] uppercase tracking-wide rounded bg-emerald-900/40 text-emerald-400 border border-emerald-800/60">
              Public
            </span>
          )}
        </div>
      )}

      <div className="flex-1 min-w-[6px]" />

      <button
        onClick={onToggleFailures}
        className={`${btn} ${failureCount > 0 ? "border-amber-700 text-amber-400" : ""}`}
      >
        Failures{failureCount > 0 ? ` (${failureCount})` : ""}
      </button>

      <button
        onClick={onOpenScale}
        disabled={!scaleAvailable}
        className={`${btn} disabled:opacity-40 disabled:cursor-not-allowed`}
        title={
          scaleAvailable
            ? "Explore scale projection"
            : "Run a simulation first"
        }
      >
        Scale
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
