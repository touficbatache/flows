export interface NodeStyle {
  id: string;
  name: string;
  color: string;
  icon?: string;
  /**
   * Data URL for uploaded image when the style uses a custom asset.
   * Stored directly so styles remain portable in localStorage.
   */
  image?: string;
  /**
   * Original filename of the uploaded image (stored in public/images).
   * Useful for referencing the image within the project structure.
   */
  imageName?: string;
  assetType?: "emoji" | "image";
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
  createdAt: string;
}

export interface GlobalStorage {
  flowcharts: Flowchart[];
  styles: NodeStyle[];
}

const STORAGE_KEY = "flowcharts";
const GLOBAL_STORAGE_KEY = "globalStorage";

export const defaultStyles: NodeStyle[] = [
  {
    id: "trigger",
    name: "Trigger",
    icon: "⚡",
    color: "#ef4343",
    assetType: "emoji",
  },
  {
    id: "agent",
    name: "AI Agent",
    icon: "🤖",
    color: "#11a4d4",
    assetType: "emoji",
  },
  {
    id: "condition",
    name: "Condition",
    icon: "🔀",
    color: "hsl(142, 71%, 45%)",
    assetType: "emoji",
  },
  {
    id: "action",
    name: "Action",
    icon: "🎯",
    color: "#7c3bed",
    assetType: "emoji",
  },
  {
    id: "database",
    name: "Database",
    icon: "💾",
    color: "#667085",
    assetType: "emoji",
  },
  {
    id: "api",
    name: "API",
    icon: "🔌",
    color: "#f97015",
    assetType: "emoji",
  },
];

function getGlobalStorage(): GlobalStorage {
  const data = localStorage.getItem(GLOBAL_STORAGE_KEY);
  if (data) {
    return JSON.parse(data);
  } else {
    const initialData: GlobalStorage = {
      flowcharts: [],
      styles: defaultStyles,
    };
    localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
}

function saveGlobalStorage(globalStorage: GlobalStorage): void {
  localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(globalStorage));
}

export function getAllFlowcharts(): Flowchart[] {
  return getGlobalStorage().flowcharts;
}

export function getFlowchart(id: number, version: number): Flowchart | null {
  const flowcharts = getAllFlowcharts();
  return flowcharts.find((f) => f.id === id && f.version === version) || null;
}

export function getLatestVersion(id: number): number {
  const flowcharts = getAllFlowcharts();
  const versions = flowcharts.filter((f) => f.id === id).map((f) => f.version);
  return versions.length > 0 ? Math.max(...versions) : 0;
}

export function saveFlowchart(
  id: number,
  title: string,
  nodes: FlowchartNode[],
  edges: FlowchartEdge[]
): number {
  const globalStorage = getGlobalStorage();
  const latestVersion = getLatestVersion(id);
  const newVersion = latestVersion + 1;

  const newFlowchart: Flowchart = {
    id,
    version: newVersion,
    title,
    nodes,
    edges,
    createdAt: new Date().toISOString(),
  };

  globalStorage.flowcharts.push(newFlowchart);
  saveGlobalStorage(globalStorage);

  return newVersion;
}

export function createNewFlowchart(): {
  id: number;
  version: number;
  title: string;
} {
  const globalStorage = getGlobalStorage();
  const maxId = globalStorage.flowcharts.reduce(
    (max, f) => Math.max(max, f.id),
    0
  );
  const newId = maxId + 1;

  return { id: newId, version: 1, title: "Flowchart #" + newId };
}

export function getAllVersions(id: number): Flowchart[] {
  const flowcharts = getAllFlowcharts();
  return flowcharts
    .filter((f) => f.id === id)
    .sort((a, b) => b.version - a.version);
}

export function deleteFlowchart(id: number): void {
  const globalStorage = getGlobalStorage();
  globalStorage.flowcharts = globalStorage.flowcharts.filter(
    (f) => f.id !== id
  );
  saveGlobalStorage(globalStorage);
}

export function getAllStyles(): NodeStyle[] {
  return getGlobalStorage().styles;
}

export function saveStyle(newStyle: NodeStyle): void {
  const globalStorage = getGlobalStorage();
  globalStorage.styles.push(newStyle);
  saveGlobalStorage(globalStorage);
}

export function updateStyle(updatedStyle: NodeStyle): void {
  const globalStorage = getGlobalStorage();
  globalStorage.styles = globalStorage.styles.map((style) =>
    style.id === updatedStyle.id ? updatedStyle : style
  );
  saveGlobalStorage(globalStorage);
}

export function deleteStyle(styleId: string): void {
  const globalStorage = getGlobalStorage();
  globalStorage.styles = globalStorage.styles.filter(
    (style) => style.id !== styleId
  );
  saveGlobalStorage(globalStorage);
}
