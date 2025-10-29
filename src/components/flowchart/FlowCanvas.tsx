import { useCallback, useEffect, useRef, useState } from "react";
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
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomNode } from "./CustomNode";
import { NodeStyle } from "@/lib/storage";
import { Trash2, X } from "lucide-react";

interface FlowCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  styles: NodeStyle[];
  onNodesChange?: (nodes: Node[]) => void;
  onNodeDragStart?: (event: React.MouseEvent, node: Node) => void;
  onNodeDragStop?: (event: React.MouseEvent, node: Node) => void;
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
  onNodeDragStart,
  onNodeDragStop,
  onEdgesChange,
  onNodeClick,
  isEditable = true,
}: FlowCanvasProps) => {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  const [rightClickedEdge, setRightClickedEdge] = useState(null);
  const ref = useRef(null);

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

  const handleNodeDragStart = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (onNodeDragStart) {
        onNodeDragStart(event, node);
      }
    },
    [onNodeDragStart]
  );

  const handleNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (onNodeDragStop) {
        onNodeDragStop(event, node);
      }
    },
    [onNodeDragStop]
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

  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      const pane = ref.current.getBoundingClientRect();
      setRightClickedEdge({
        id: edge.id,
        top: event.clientY < pane.bottom - 200 && event.clientY - pane.top,
        left: event.clientX < pane.right - 200 && event.clientX - pane.left,
        right: event.clientX >= pane.right - 200 && pane.right - event.clientX,
        bottom:
          event.clientY >= pane.bottom - 200 && pane.bottom - event.clientY,
      });
    },
    []
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
        ref={ref}
        nodes={nodes}
        edges={edges}
        onNodesChange={isEditable ? handleNodesChange : undefined}
        onNodeDragStart={isEditable ? handleNodeDragStart : undefined}
        onNodeDragStop={isEditable ? handleNodeDragStop : undefined}
        onEdgesChange={isEditable ? handleEdgesChange : undefined}
        onEdgeContextMenu={isEditable ? handleEdgeContextMenu : undefined}
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
      {rightClickedEdge && (
        <div
          className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg"
          style={{
            top: rightClickedEdge.top,
            left: rightClickedEdge.left,
            right: rightClickedEdge.right,
            bottom: rightClickedEdge.bottom,
          }}
        >
          <div className="flex justify-end p-1">
            <button
              className="text-gray-500 hover:bg-black/5 rounded-md p-1.5"
              onClick={() => setRightClickedEdge(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            className="w-full text-left text-sm text-destructive px-4 py-2 hover:bg-gray-100 flex items-center"
            onClick={() => {
              const newEdges = edges.filter(
                (e) => e.id !== rightClickedEdge.id
              );
              setEdges(newEdges);
              if (onEdgesChange) {
                onEdgesChange(newEdges);
              }
              setRightClickedEdge(null);
            }}
          >
            <Trash2 className="inline h-4 w-4 mr-2" />
            Delete Edge
          </button>
        </div>
      )}
    </div>
  );
};
