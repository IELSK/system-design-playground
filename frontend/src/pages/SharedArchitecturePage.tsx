import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  BackgroundVariant,
} from "@xyflow/react";
import axios from "axios";
import "@xyflow/react/dist/style.css";
import ArchitectureNode from "../components/nodes/ArchitectureNode";
import { PublicArchitecture } from "../types/architecture";

const nodeTypes = { architecture: ArchitectureNode };

// Use a plain axios instance (no auth interceptors) for the public endpoint
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

export default function SharedArchitecturePage() {
  const { id } = useParams<{ id: string }>();
  const [arch, setArch] = useState<PublicArchitecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    publicApi
      .get<{ architecture: PublicArchitecture }>(`/architectures/public/${id}`)
      .then((res) => setArch(res.data.architecture))
      .catch(() => setError("Architecture not found or not public"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-500 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error || !arch) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center gap-3">
        <p className="text-red-400">{error ?? "Architecture not found"}</p>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm">
          Go to editor
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
      <div className="flex items-center justify-between bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold">{arch.name}</h1>
          <p className="text-[11px] text-gray-500">
            by {arch.user.name}
            {arch.description ? ` · ${arch.description}` : ""}
          </p>
        </div>
        <Link
          to="/"
          className="px-3 py-1.5 text-xs font-semibold rounded bg-indigo-600 text-white hover:bg-indigo-500"
        >
          Open editor
        </Link>
      </div>

      <div className="flex-1">
        <ReactFlowProvider>
          <ReactFlow
            nodes={arch.graph.nodes}
            edges={arch.graph.edges}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            fitView
            className="bg-gray-950"
          >
            <Background
              variant={BackgroundVariant.Dots}
              color="#374151"
              gap={20}
              size={1}
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
