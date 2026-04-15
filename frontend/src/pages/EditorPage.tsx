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
import { SimulationResponse, Failure } from "../types/simulation";
import { CostEstimateResponse } from "../types/cost";
import ArchitectureNode from "../components/nodes/ArchitectureNode";
import Sidebar from "../components/editor/Sidebar";
import ConfigPanel from "../components/editor/ConfigPanel";
import EdgePanel from "../components/editor/EdgePanel";
import FailurePanel from "../components/editor/FailurePanel";
import Toolbar from "../components/editor/Toolbar";
import Dashboard from "../components/dashboard/Dashboard";
import { useConnectionValidator } from "../hooks/useConnectionValidator";
import { useGraphStorage } from "../hooks/useGraphStorage";
import api from "../services/api";

const nodeTypes = { architecture: ArchitectureNode };

let nodeIdCounter = 0;
function getNextId() {
  return `node_${++nodeIdCounter}`;
}

interface EdgeData extends Record<string, unknown> {
  weight?: number;
}

function computeEdgeLabel(edge: Edge, allEdges: Edge[]): string | undefined {
  const siblings = allEdges.filter((e) => e.source === edge.source);
  if (siblings.length < 2) return undefined;
  const total = siblings.reduce(
    (s, e) => s + ((e.data?.weight as number | undefined) ?? 0),
    0,
  );
  const w = (edge.data?.weight as number | undefined) ?? 0;
  const pct =
    total > 0 ? Math.round((w / total) * 100) : Math.round(100 / siblings.length);
  return `${pct}%`;
}

function decorateEdgeLabels(edges: Edge[]): Edge[] {
  return edges.map((e) => ({
    ...e,
    label: computeEdgeLabel(e, edges),
    labelStyle: { fill: "#d1d5db", fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: "#1f2937", fillOpacity: 0.9 },
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 4,
  }));
}

function EditorCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showFailures, setShowFailures] = useState(false);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);
  const [costResult, setCostResult] = useState<CostEstimateResponse | null>(null);
  const [simulating, setSimulating] = useState(false);

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
      setEdges(decorateEdgeLabels(stored.edges));
      const maxId = stored.nodes.reduce((max, n) => {
        const num = parseInt(n.id.replace("node_", ""), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      nodeIdCounter = maxId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drop failures that refer to deleted nodes
  useEffect(() => {
    setFailures((prev) => {
      const ids = new Set(nodes.map((n) => n.id));
      const filtered = prev.filter((f) => ids.has(f.node_id));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [nodes]);

  // Sync failureMode onto canvas nodes for instant visual feedback
  useEffect(() => {
    const failureByNode: Record<string, string> = {};
    for (const f of failures) failureByNode[f.node_id] = f.type;

    setNodes((nds) =>
      nds.map((n) => {
        const mode = failureByNode[n.id];
        if (n.data.failureMode === mode) return n;
        return { ...n, data: { ...n.data, failureMode: mode } };
      }),
    );
  }, [failures, setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const data: EdgeData = { weight: 50 };
        const added = addEdge({ ...connection, data }, eds);
        return decorateEdgeLabels(added);
      });
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

      const nodeType = event.dataTransfer.getData(
        "application/reactflow-nodetype",
      ) as NodeType;
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
      setSelectedEdge(null);
    },
    [],
  );

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const onConfigChange = useCallback(
    (nodeId: string, config: NodeConfig) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, config } } : n,
        ),
      );
      setSelectedNode((prev) =>
        prev && prev.id === nodeId
          ? { ...prev, data: { ...prev.data, config } }
          : prev,
      );
    },
    [setNodes],
  );

  const onEdgeWeightChange = useCallback(
    (edgeId: string, weight: number) => {
      setEdges((eds) => {
        const updated = eds.map((e) =>
          e.id === edgeId ? { ...e, data: { ...(e.data ?? {}), weight } } : e,
        );
        return decorateEdgeLabels(updated);
      });
      setSelectedEdge((prev) =>
        prev && prev.id === edgeId
          ? { ...prev, data: { ...(prev.data ?? {}), weight } }
          : prev,
      );
    },
    [setEdges],
  );

  const onEdgeDelete = useCallback(
    (edgeId: string) => {
      setEdges((eds) => decorateEdgeLabels(eds.filter((e) => e.id !== edgeId)));
      setSelectedEdge(null);
    },
    [setEdges],
  );

  const handleSave = useCallback(() => {
    save(nodes, edges);
  }, [nodes, edges, save]);

  const handleLoad = useCallback(() => {
    const stored = load();
    if (stored) {
      setNodes(stored.nodes);
      setEdges(decorateEdgeLabels(stored.edges));
    }
  }, [load, setNodes, setEdges]);

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setSelectedEdge(null);
    setFailures([]);
    clear();
  }, [setNodes, setEdges, clear]);

  const handleSimulate = useCallback(async () => {
    if (nodes.length === 0) return;

    setSimulating(true);

    const clientNode = nodes.find((n) => n.data.nodeType === "client");
    const traffic = clientNode
      ? (clientNode.data.config as { rps: number }).rps
      : 1000;

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
        weight: (e.data?.weight as number | undefined) ?? undefined,
      })),
      failures,
    };

    try {
      const [simRes, costRes] = await Promise.all([
        api.post<SimulationResponse>("/simulate", payload),
        api.post<CostEstimateResponse>("/cost-estimate", {
          nodes: payload.nodes,
          edges: payload.edges,
        }),
      ]);
      const data = simRes.data;
      const bottleneckIds = new Set(
        data.nodes.filter((nr) => nr.is_bottleneck).map((nr) => nr.id),
      );
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, bottleneck: bottleneckIds.has(n.id) },
        })),
      );
      setSimResult(data);
      setCostResult(costRes.data);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimulating(false);
    }
  }, [nodes, edges, failures, setNodes]);

  const selectedEdgeSiblings = selectedEdge
    ? edges.filter((e) => e.source === selectedEdge.source)
    : [];

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
        onToggleFailures={() => setShowFailures((v) => !v)}
        failureCount={failures.length}
        simulating={simulating}
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
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            isValidConnection={isValidConnection}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-950"
          >
            <Background
              variant={BackgroundVariant.Dots}
              color="#374151"
              gap={20}
              size={1}
            />
            <Controls />
          </ReactFlow>
        </div>

        {simResult && (
          <Dashboard
            result={simResult}
            cost={costResult}
            onClose={() => {
              setSimResult(null);
              setCostResult(null);
            }}
          />
        )}

        {selectedNode && (
          <ConfigPanel
            node={selectedNode}
            onChange={onConfigChange}
            onClose={() => setSelectedNode(null)}
          />
        )}

        {selectedEdge && (
          <EdgePanel
            edge={selectedEdge}
            siblings={selectedEdgeSiblings}
            onChange={onEdgeWeightChange}
            onDelete={onEdgeDelete}
            onClose={() => setSelectedEdge(null)}
          />
        )}

        {showFailures && (
          <FailurePanel
            nodes={nodes}
            failures={failures}
            onChange={setFailures}
            onClose={() => setShowFailures(false)}
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
