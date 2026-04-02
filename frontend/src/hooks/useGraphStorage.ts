import { useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { NodeData } from "../types/nodes";

const STORAGE_KEY = "sdp_architecture";

interface StoredGraph {
  nodes: Node<NodeData>[];
  edges: Edge[];
}

export function useGraphStorage() {
  const save = useCallback((nodes: Node<NodeData>[], edges: Edge[]) => {
    const data: StoredGraph = { nodes, edges };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const load = useCallback((): StoredGraph | null => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredGraph;
    } catch {
      return null;
    }
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { save, load, clear };
}
