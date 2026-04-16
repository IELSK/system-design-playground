import { prisma } from "../lib/prisma";
import { AppError } from "../lib/AppError";

export interface GraphPayload {
  nodes: unknown[];
  edges: unknown[];
}

export interface CreateInput {
  name: string;
  description?: string;
  graph: GraphPayload;
  isPublic?: boolean;
}

export interface UpdateInput {
  name?: string;
  description?: string | null;
  graph?: GraphPayload;
  isPublic?: boolean;
}

function assertValidGraph(graph: unknown): asserts graph is GraphPayload {
  if (!graph || typeof graph !== "object") {
    throw new AppError("graph is required", 400);
  }
  const g = graph as Record<string, unknown>;
  if (!Array.isArray(g.nodes) || !Array.isArray(g.edges)) {
    throw new AppError("graph must contain nodes[] and edges[]", 400);
  }
}

export async function createArchitecture(userId: string, input: CreateInput) {
  if (!input.name || input.name.trim().length === 0) {
    throw new AppError("name is required", 400);
  }
  assertValidGraph(input.graph);

  return prisma.architecture.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      graph: input.graph as never,
      isPublic: input.isPublic ?? false,
      userId,
    },
  });
}

export async function listArchitectures(userId: string) {
  return prisma.architecture.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getArchitecture(userId: string, id: string) {
  const arch = await prisma.architecture.findUnique({ where: { id } });
  if (!arch) throw new AppError("Architecture not found", 404);
  if (arch.userId !== userId) throw new AppError("Forbidden", 403);
  return arch;
}

export async function getPublicArchitecture(id: string) {
  const arch = await prisma.architecture.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  });
  if (!arch || !arch.isPublic) throw new AppError("Architecture not found", 404);
  return arch;
}

export async function updateArchitecture(
  userId: string,
  id: string,
  input: UpdateInput,
) {
  const existing = await prisma.architecture.findUnique({ where: { id } });
  if (!existing) throw new AppError("Architecture not found", 404);
  if (existing.userId !== userId) throw new AppError("Forbidden", 403);

  if (input.graph !== undefined) assertValidGraph(input.graph);
  if (input.name !== undefined && input.name.trim().length === 0) {
    throw new AppError("name cannot be empty", 400);
  }

  return prisma.architecture.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.graph !== undefined ? { graph: input.graph as never } : {}),
      ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
    },
  });
}

export async function deleteArchitecture(userId: string, id: string) {
  const existing = await prisma.architecture.findUnique({ where: { id } });
  if (!existing) throw new AppError("Architecture not found", 404);
  if (existing.userId !== userId) throw new AppError("Forbidden", 403);
  await prisma.architecture.delete({ where: { id } });
}
