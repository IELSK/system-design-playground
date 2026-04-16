import { Node, Edge } from "@xyflow/react";
import { NodeData } from "./nodes";

export interface Architecture {
  id: string;
  name: string;
  description: string | null;
  graph: {
    nodes: Node<NodeData>[];
    edges: Edge[];
  };
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ArchitectureSummary {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicArchitecture extends Architecture {
  user: { name: string };
}
