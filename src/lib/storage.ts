const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_API_URL &&
    import.meta.env.VITE_API_URL.replace(/\/$/, "")) ||
  "/api";

export interface NodeStyle {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
  image?: string | null;
  imageName?: string | null;
  assetType?: "emoji" | "image" | null;
  description?: string | null;
  externalUrl?: string | null;
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastUsedAt?: string;
}

export interface FlowchartNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description: string;
    styleId: string;
  };
}

export interface FlowchartEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface Flowchart {
  id: number;
  version: number;
  title: string;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  styles: NodeStyle[];
  createdAt: string;
}

export interface CreateFlowchartResponse {
  id: number;
  version: number;
  title: string;
}

export interface SaveFlowchartResponse {
  id: number;
  version: number;
  createdAt: string;
}

export interface AiGeneratedFlowchart {
  title: string;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

export type CreateNodeStyleInput = Omit<
  NodeStyle,
  "id" | "createdAt" | "updatedAt" | "lastUsedAt" | "isCustom"
> & {
  id?: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const isJson = response.headers
    .get("content-type")
    ?.toLowerCase()
    .includes("application/json");
  const payload =
    text && isJson
      ? JSON.parse(text)
      : text
      ? (text as unknown as T)
      : undefined;

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? (payload as { error: string }).error
        : response.statusText || "Unexpected error";
    throw new Error(message);
  }

  return payload as T;
}

export const defaultStyles: NodeStyle[] = [
  {
    id: "trigger",
    name: "Trigger",
    icon: "⚡",
    color: "#ef4343",
    assetType: "emoji",
    isCustom: false,
  },
  {
    id: "agent",
    name: "AI Agent",
    icon: "🤖",
    color: "#11a4d4",
    assetType: "emoji",
    isCustom: false,
  },
  {
    id: "condition",
    name: "Condition",
    icon: "🔀",
    color: "hsl(142, 71%, 45%)",
    assetType: "emoji",
    isCustom: false,
  },
  {
    id: "action",
    name: "Action",
    icon: "🎯",
    color: "#7c3bed",
    assetType: "emoji",
    isCustom: false,
  },
  {
    id: "database",
    name: "Database",
    icon: "💾",
    color: "#667085",
    assetType: "emoji",
    isCustom: false,
  },
  {
    id: "api",
    name: "API",
    icon: "🔌",
    color: "#f97015",
    assetType: "emoji",
    isCustom: false,
  },
];

export async function getAllFlowcharts(): Promise<Flowchart[]> {
  return request<Flowchart[]>("/flowcharts");
}

export async function getFlowchart(
  id: number,
  version: number
): Promise<Flowchart | null> {
  try {
    return await request<Flowchart>(`/flowcharts/${id}/versions/${version}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return null;
    }
    throw error;
  }
}

export async function getLatestVersion(id: number): Promise<number> {
  const result = await request<{ version: number }>(`/flowcharts/${id}/latest`);
  return result?.version ?? 0;
}

export async function saveFlowchart(
  id: number,
  title: string,
  nodes: FlowchartNode[],
  edges: FlowchartEdge[],
  styles: NodeStyle[]
): Promise<SaveFlowchartResponse> {
  return request<SaveFlowchartResponse>(`/flowcharts/${id}/versions`, {
    method: "POST",
    body: JSON.stringify({ title, nodes, edges, styles }),
  });
}

export async function createNewFlowchart(
  title?: string
): Promise<CreateFlowchartResponse> {
  return request<CreateFlowchartResponse>("/flowcharts", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function getAllVersions(id: number): Promise<Flowchart[]> {
  return request<Flowchart[]>(`/flowcharts/${id}/versions`);
}

export async function deleteFlowchart(id: number): Promise<void> {
  await request<void>(`/flowcharts/${id}`, { method: "DELETE" });
}

export async function getAllStyles(): Promise<NodeStyle[]> {
  try {
    const styles = await request<NodeStyle[]>("/styles");
    return styles.length > 0 ? styles : defaultStyles;
  } catch (error) {
    console.error("Failed to load styles. Falling back to defaults.", error);
    return defaultStyles;
  }
}

export async function getStyleById(styleId: string): Promise<NodeStyle | null> {
  try {
    return await request<NodeStyle>(`/styles/${encodeURIComponent(styleId)}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return null;
    }
    throw error;
  }
}

export async function getRecentlyUsedStyles(): Promise<NodeStyle[]> {
  try {
    return await request<NodeStyle[]>("/styles/recent");
  } catch (error) {
    console.error("Failed to load recently used styles", error);
    return [];
  }
}

export async function searchStyles(query: string): Promise<NodeStyle[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const params = new URLSearchParams({ q: trimmed });
  return request<NodeStyle[]>(`/styles?${params.toString()}`);
}

export async function markStyleAsRecentlyUsed(
  styleId: string
): Promise<NodeStyle> {
  return request<NodeStyle>(`/styles/${encodeURIComponent(styleId)}/recent`, {
    method: "POST",
  });
}

export async function removeStyleFromRecentlyUsed(
  styleId: string
): Promise<void> {
  await request<void>(`/styles/${encodeURIComponent(styleId)}/recent`, {
    method: "DELETE",
  });
}

export async function saveStyle(
  newStyle: CreateNodeStyleInput
): Promise<NodeStyle> {
  return request<NodeStyle>("/styles", {
    method: "POST",
    body: JSON.stringify(newStyle),
  });
}

export async function updateStyle(
  styleId: string,
  updatedStyle: CreateNodeStyleInput
): Promise<NodeStyle> {
  return request<NodeStyle>(`/styles/${styleId}`, {
    method: "PUT",
    body: JSON.stringify(updatedStyle),
  });
}

export async function deleteStyle(styleId: string): Promise<void> {
  await request<void>(`/styles/${styleId}`, {
    method: "DELETE",
  });
}

export async function generateFlowchartFromPrompt(
  prompt: string
): Promise<AiGeneratedFlowchart> {
  return request<AiGeneratedFlowchart>("/ai/flowchart", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}
