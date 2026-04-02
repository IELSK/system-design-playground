import { useCallback } from "react";
import { Edge, Connection, Node } from "@xyflow/react";
import { NodeData } from "../types/nodes";

export function useConnectionValidator(nodes: Node<NodeData>[]) {
  return useCallback(
    (connection: Edge | Connection): boolean => {
      const source = nodes.find((n) => n.id === connection.source);
      const target = nodes.find((n) => n.id === connection.target);
      if (!source || !target) return false;

      const sourceType = source.data.nodeType;
      const targetType = target.data.nodeType;

      // Client can only be a source, never a target
      if (targetType === "client") return false;

      // No self-connections
      if (connection.source === connection.target) return false;

      return true;
    },
    [nodes],
  );
}