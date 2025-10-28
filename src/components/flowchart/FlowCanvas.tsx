import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode } from './CustomNode';
import { NodeStyle } from '@/lib/storage';

interface FlowCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  styles: NodeStyle[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onNodeClick?: (nodeId: string) => void;
  isEditable?: boolean;
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

export const FlowCanvas = ({
  initialNodes,
  initialEdges,
  styles,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  isEditable = true,
}: FlowCanvasProps) => {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeInternal(changes);
      if (onNodesChange) {
        // Delay to get updated nodes
        setTimeout(() => onNodesChange(nodes), 0);
      }
    },
    [onNodesChangeInternal, onNodesChange, nodes]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChangeInternal(changes);
      if (onEdgesChange) {
        setTimeout(() => onEdgesChange(edges), 0);
      }
    },
    [onEdgesChangeInternal, onEdgesChange, edges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!isEditable) return;
      setEdges((eds) => {
        const newEdges = addEdge(connection, eds);
        if (onEdgesChange) {
          onEdgesChange(newEdges);
        }
        return newEdges;
      });
    },
    [setEdges, onEdgesChange, isEditable]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onNodeClick && isEditable) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick, isEditable]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isEditable ? handleNodesChange : undefined}
        onEdgesChange={isEditable ? handleEdgesChange : undefined}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        nodesDraggable={isEditable}
        nodesConnectable={isEditable}
        elementsSelectable={isEditable}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
