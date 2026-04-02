import { DragEvent, useState } from "react";
import { NODE_TYPES, NODE_LABELS, NODE_COLORS, NodeType } from "../../types/nodes";
 
export default function Sidebar() {
  const [open, setOpen] = useState(false);
 
  function onDragStart(event: DragEvent, nodeType: NodeType) {
    event.dataTransfer.setData("application/reactflow-nodetype", nodeType);
    event.dataTransfer.effectAllowed = "move";
    setOpen(false);
  }
 
  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed top-20 right-2 z-30 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-xs text-gray-300"
      >
        {open ? "✕" : "☰ Add"}
      </button>
 
      {/* Sidebar panel */}
      <div
        className={`
          bg-gray-900 border-r border-gray-800 p-3 flex flex-col gap-2 overflow-y-auto
          fixed md:static z-20 top-0 left-0 h-full w-48
          transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 mt-1">
          Components
        </div>
 
        {NODE_TYPES.map((type) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className="px-3 py-2 rounded-md border border-gray-700 bg-gray-800 cursor-grab active:cursor-grabbing hover:border-gray-500 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NODE_COLORS[type] }} />
              <span className="text-sm text-gray-200">{NODE_LABELS[type]}</span>
            </div>
          </div>
        ))}
      </div>
 
      {/* Backdrop on mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 z-10 bg-black/50"
        />
      )}
    </>
  );
}