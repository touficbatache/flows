export interface NodeStyle {
  id: string;
  name: string;
  icon: string;
  color: string;
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
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  styles: NodeStyle[];
  createdAt: string;
}

const STORAGE_KEY = 'flowcharts';

export const defaultStyles: NodeStyle[] = [
  { id: 'trigger', name: 'Trigger', icon: '⚡', color: 'hsl(0, 84%, 60%)' },
  { id: 'agent', name: 'AI Agent', icon: '🤖', color: 'hsl(195, 85%, 45%)' },
  { id: 'condition', name: 'Condition', icon: '🔀', color: 'hsl(142, 71%, 45%)' },
  { id: 'action', name: 'Action', icon: '🎯', color: 'hsl(262, 83%, 58%)' },
  { id: 'database', name: 'Database', icon: '💾', color: 'hsl(220, 13%, 46%)' },
  { id: 'api', name: 'API', icon: '🔌', color: 'hsl(24, 95%, 53%)' },
];

export function getAllFlowcharts(): Flowchart[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getFlowchart(id: number, version: number): Flowchart | null {
  const flowcharts = getAllFlowcharts();
  return flowcharts.find(f => f.id === id && f.version === version) || null;
}

export function getLatestVersion(id: number): number {
  const flowcharts = getAllFlowcharts();
  const versions = flowcharts.filter(f => f.id === id).map(f => f.version);
  return versions.length > 0 ? Math.max(...versions) : 0;
}

export function saveFlowchart(
  id: number,
  nodes: FlowchartNode[],
  edges: FlowchartEdge[],
  styles: NodeStyle[]
): number {
  const flowcharts = getAllFlowcharts();
  const latestVersion = getLatestVersion(id);
  const newVersion = latestVersion + 1;

  const newFlowchart: Flowchart = {
    id,
    version: newVersion,
    nodes,
    edges,
    styles,
    createdAt: new Date().toISOString(),
  };

  flowcharts.push(newFlowchart);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flowcharts));

  return newVersion;
}

export function createNewFlowchart(): { id: number; version: number } {
  const flowcharts = getAllFlowcharts();
  const maxId = flowcharts.reduce((max, f) => Math.max(max, f.id), 0);
  const newId = maxId + 1;

  const newFlowchart: Flowchart = {
    id: newId,
    version: 1,
    nodes: [],
    edges: [],
    styles: defaultStyles,
    createdAt: new Date().toISOString(),
  };

  flowcharts.push(newFlowchart);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flowcharts));

  return { id: newId, version: 1 };
}

export function getAllVersions(id: number): Flowchart[] {
  const flowcharts = getAllFlowcharts();
  return flowcharts
    .filter(f => f.id === id)
    .sort((a, b) => b.version - a.version);
}
