import { SimNode, SimEdge } from "./types";

export interface AdjacencyList {
  [nodeId: string]: string[];
}

export function buildAdjacencyList(edges: SimEdge[]): AdjacencyList {
  const adj: AdjacencyList = {};
  for (const edge of edges) {
    if (!adj[edge.source]) adj[edge.source] = [];
    adj[edge.source].push(edge.target);
  }
  return adj;
}

export function topologicalSort(nodes: SimNode[], edges: SimEdge[]): SimNode[] {
  const adj = buildAdjacencyList(edges);
  const inDegree: Record<string, number> = {};
  const nodeMap: Record<string, SimNode> = {};

  for (const node of nodes) {
    inDegree[node.id] = 0;
    nodeMap[node.id] = node;
  }

  for (const edge of edges) {
    inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
  }

  // Start from nodes with no incoming edges (typically the client)
  const queue: string[] = [];
  for (const node of nodes) {
    if (inDegree[node.id] === 0) queue.push(node.id);
  }

  const sorted: SimNode[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(nodeMap[id]);

    for (const neighbor of adj[id] || []) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }

  return sorted;
}
