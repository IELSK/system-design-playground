import { useState, useCallback, useRef, useEffect, DragEvent } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  NodeData,
  NodeType,
  NodeConfig,
  NODE_LABELS,
  DEFAULT_CONFIGS,
} from "../types/nodes";
import ArchitectureNode from "../components/nodes/ArchitectureNode";
import Sidebar from "../components/editor/Sidebar";
import ConfigPanel from "../components/editor/ConfigPanel";
import Toolbar from "../components/editor/Toolbar";
import { useConnectionValidator } from "../hooks/useConnectionValidator";
import { useGraphStorage } from "../hooks/useGraphStorage";
import api from "../services/api";

const nodeTypes = { architecture: ArchitectureNode };

let nodeIdCounter = 0;
function getNextId() {
  return `node_${++nodeIdCounter}`;
}

function EditorCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);

  const isValidConnection = useConnectionValidator(nodes);
  const { save, load, clear } = useGraphStorage();

  // Autosave on every change
  useEffect(() => {
    if (nodes.length > 0) {
      save(nodes, edges);
    }
  }, [nodes, edges, save]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = load();
    if (stored && stored.nodes.length > 0) {
      setNodes(stored.nodes);
      setEdges(stored.edges);
      const maxId = stored.nodes.reduce((max, n) => {
        const num = parseInt(n.id.replace("node_", ""), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      nodeIdCounter = maxId;
    }
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData("application/reactflow-nodetype") as NodeType;
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node<NodeData> = {
        id: getNextId(),
        type: "architecture",
        position,
        data: {
          label: NODE_LABELS[nodeType],
          nodeType,
          config: { ...DEFAULT_CONFIGS[nodeType] },
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<NodeData>) => {
      setSelectedNode(node);
    },
    [],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onConfigChange = useCallback(
    (nodeId: string, config: NodeConfig) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, config } } : n)),
      );
      setSelectedNode((prev) =>
        prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, config } } : prev,
      );
    },
    [setNodes],
  );

  const handleSave = useCallback(() => {
    save(nodes, edges);
  }, [nodes, edges, save]);

  const handleLoad = useCallback(() => {
    const stored = load();
    if (stored) {
      setNodes(stored.nodes);
      setEdges(stored.edges);
    }
  }, [load, setNodes, setEdges]);

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    clear();
  }, [setNodes, setEdges, clear]);

  const handleSimulate = useCallback(async () => {
    if (nodes.length === 0) return;

    const clientNode = nodes.find((n) => n.data.nodeType === "client");
    const traffic = clientNode ? (clientNode.data.config as { rps: number }).rps : 1000;

    const payload = {
      traffic,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.data.nodeType,
        config: n.data.config,
      })),
      edges: edges.map((e) => ({
        source: e.source,
        target: e.target,
      })),
      failures: [],
    };

    try {
      const res = await api.post("/simulate", payload);
      console.log("Simulation result:", res.data);
    } catch (err) {
      console.log("Simulate endpoint not implemented yet (Phase 04)");
    }
  }, [nodes, edges]);

  return (
    <div className="flex flex-col flex-1 h-full">
      <Toolbar
        onSave={handleSave}
        onLoad={handleLoad}
        onClear={handleClear}
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onFitView={() => fitView()}
        onSimulate={handleSimulate}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div ref={reactFlowWrapper} className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            isValidConnection={isValidConnection}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-950"
          >
            <Background variant={BackgroundVariant.Dots} color="#374151" gap={20} size={1} />
            <Controls />
          </ReactFlow>
        </div>

        {selectedNode && (
          <ConfigPanel
            node={selectedNode}
            onChange={onConfigChange}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
        <EditorCanvas />
      </div>
    </ReactFlowProvider>
  );
}