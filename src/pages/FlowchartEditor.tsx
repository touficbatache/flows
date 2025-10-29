import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Node, Edge } from "reactflow";
import { FlowCanvas } from "@/components/flowchart/FlowCanvas";
import { NodeEditPanel } from "@/components/flowchart/NodeEditPanel";
import {
  getFlowchart,
  saveFlowchart,
  defaultStyles,
  NodeStyle,
  createNewFlowchart,
  getLatestVersion,
  deleteFlowchart,
} from "@/lib/storage";
import { toast } from "sonner";
import Toolbar from "@/components/flowchart/Toolbar";
import { CommandStack } from "@/commands/CommandStack";
import { CommandAddNode } from "@/commands/CommandAddNode";
import { CommandDeleteNode } from "@/commands/CommandDeleteNode";
import { CommandMoveNode } from "@/commands/CommandMoveNode";
import { CommandAddEdge } from "@/commands/CommandAddEdge";
import { CommandDeleteEdge } from "@/commands/CommandDeleteEdge";

export default function FlowchartEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const commandStack = useMemo(() => new CommandStack(), []);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [styles, setStyles] = useState<NodeStyle[]>(defaultStyles);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>(null);
  const [currentVersion, setCurrentVersion] = useState<number | null>(
    getLatestVersion(Number(id))
  );
  const nodeDragStartRef = useRef<{ id: string; x: number; y: number } | null>(
    null
  );

  useEffect(() => {
    if (id) {
      const flowchart = getFlowchart(Number(id), currentVersion);
      if (flowchart) {
        setNodes(
          flowchart.nodes.map((node) => ({
            ...node,
            type: "custom",
            data: {
              ...node.data,
              style: flowchart.styles.find((s) => s.id === node.data.styleId),
            },
          }))
        );
        setEdges(flowchart.edges);
        setStyles(flowchart.styles);
        setCurrentId(flowchart.id);
        setCurrentTitle(flowchart.title);
      } else {
        toast.error("Flowchart not found");
        navigate("/");
      }
    } else {
      // Create new flowchart
      const {
        id: newId,
        version: newVersion,
        title: newTitle,
      } = createNewFlowchart();
      setCurrentId(newId);
      setCurrentVersion(newVersion);
      setCurrentTitle(newTitle);
      toast.success("New flowchart created");
    }
  }, [id, currentVersion, navigate]);

  useEffect(() => {
    const listener = {
      commandStackChanged: () => setHasChanges(!commandStack.isUndoEmpty()),
    };
    commandStack.addListener(listener);
    return () => commandStack.removeListener(listener);
  }, [commandStack]);

  const handleUndo = useCallback(() => {
    commandStack.undo();
  }, [commandStack]);

  const handleRedo = useCallback(() => {
    commandStack.redo();
  }, [commandStack]);

  const handleAddNode = useCallback(() => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: "custom",
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      data: {
        label: "New Node",
        description: "",
        styleId: styles[0].id,
        style: styles[0],
      },
    };
    const command = new CommandAddNode(
      {
        addNode: (node) => setNodes((nds) => [...nds, node]),
        removeNode: (id: string) =>
          setNodes((nds) => nds.filter((n) => n.id !== id)),
      },
      newNode
    );
    commandStack.addCommand(command);
  }, [commandStack, styles]);

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    // console.log("Nodes changed:", newNodes);
    setNodes(newNodes);
    // setHasChanges(true);
  }, []);

  const handleNodeDragStart = useCallback(
    (event: React.MouseEvent, node: Node) => {
      nodeDragStartRef.current = { id: node.id, ...node.position };
    },
    []
  );

  const handleNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (
        !nodeDragStartRef.current ||
        (nodeDragStartRef.current.x === node.position.x &&
          nodeDragStartRef.current.y === node.position.y)
      )
        return;
      const command = new CommandMoveNode(
        {
          moveNode: (id: string, position: { x: number; y: number }) =>
            setNodes((nds) =>
              nds.map((n) => (n.id === id ? { ...n, position } : n))
            ),
        },
        node.id,
        nodeDragStartRef.current || { x: 0, y: 0 },
        node.position
      );
      commandStack.addCommand(command);
      nodeDragStartRef.current = null;
    },
    [commandStack, nodeDragStartRef]
  );

  const handleEdgesChange = useCallback(
    (newEdges: Edge[]) => {
      const newlyAdded = newEdges.filter(
        (ne) => !edges.find((e) => e.id === ne.id)
      );
      const newlyDeleted = edges.filter(
        (e) => !newEdges.find((ne) => ne.id === e.id)
      );
      // console.log("Edges changed:", newEdges, newlyAdded, newlyDeleted);
      if (newlyAdded.length > 0) {
        newlyAdded.forEach((edge) => {
          const command = new CommandAddEdge(
            {
              addEdge: (e) => setEdges((eds) => [...eds, e]),
              removeEdge: (id: string) =>
                setEdges((eds) => eds.filter((e) => e.id !== id)),
            },
            edge
          );
          commandStack.addCommand(command);
        });
      }
      if (newlyDeleted.length > 0) {
        newlyDeleted.forEach((edge) => {
          const command = new CommandDeleteEdge(
            {
              addEdge: (e) => setEdges((eds) => [...eds, e]),
              removeEdge: (id: string) =>
                setEdges((eds) => eds.filter((e) => e.id !== id)),
            },
            edge
          );
          commandStack.addCommand(command);
        });
      }
      // setEdges(newEdges);
      // setHasChanges(true);
    },
    [commandStack, edges]
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleSaveNode = useCallback(
    (label: string, description: string, styleId: string) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  label,
                  description,
                  styleId,
                  style: styles.find((s) => s.id === styleId),
                },
              }
            : node
        )
      );
      setSelectedNodeId(null);
      // setHasChanges(true);
    },
    [selectedNodeId, styles]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      if (nodeToDelete) {
        const command = new CommandDeleteNode(
          {
            addNode: (node) => setNodes((nds) => [...nds, node]),
            removeNode: (id: string) =>
              setNodes((nds) => nds.filter((n) => n.id !== id)),
          },
          nodeToDelete
        );
        commandStack.addCommand(command);
        setSelectedNodeId(null);
        // setHasChanges(true);
      }
    },
    [commandStack, nodes]
  );

  const handleCreateStyle = useCallback((newStyle: NodeStyle) => {
    setStyles((prevStyles) => [...prevStyles, newStyle]);
    setHasChanges(true);
    toast.success("New style created");
  }, []);

  const handleSave = useCallback(() => {
    if (currentId !== null) {
      const cleanNodes = nodes.map(({ data, ...node }) => ({
        ...node,
        data: {
          label: data.label,
          description: data.description,
          styleId: data.styleId,
        },
      }));

      const newVersion = saveFlowchart(
        currentId,
        currentTitle,
        cleanNodes,
        edges,
        styles
      );
      setCurrentVersion(newVersion);
      setHasChanges(false);
      toast.success(`Saved as version ${newVersion}`);
      navigate(`/${currentId}/${newVersion}`, { replace: true });
    }
  }, [currentId, currentTitle, nodes, edges, styles, navigate]);

  const handleExportJson = useCallback(() => {
    const data = {
      id: currentId,
      version: currentVersion,
      nodes: nodes.map(({ data, ...node }) => ({
        ...node,
        data: {
          label: data.label,
          description: data.description,
          styleId: data.styleId,
        },
      })),
      edges,
      styles,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowchart-${currentId}-v${currentVersion}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported");
  }, [currentId, currentVersion, nodes, edges, styles]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.userAgentData?.platform
        ?.toLowerCase()
        .includes("mac");
      const undoKey = isMac
        ? event.metaKey && !event.shiftKey && event.key === "z"
        : event.ctrlKey && !event.shiftKey && event.key === "z";
      const redoKey = isMac
        ? event.metaKey && event.shiftKey && event.key.toLowerCase() === "z"
        : event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "z";

      if (undoKey) {
        event.preventDefault();
        handleUndo();
      } else if (redoKey) {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasChanges) {
        event.preventDefault();
        event.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasChanges]);

  const handleNavigate = useCallback(
    (path: string) => {
      if (hasChanges) {
        const confirmLeave = window.confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        );
        if (!confirmLeave) return;
      }
      navigate(path);
    },
    [hasChanges, navigate]
  );

  return (
    <div className="flex flex-col h-screen">
      <Toolbar
        mode="edit"
        title={`${currentTitle}${hasChanges ? "*" : ""}`}
        selectedVersion={currentVersion || 0}
        versions={null}
        hasChanges={hasChanges}
        hasPreview={id !== undefined}
        handleNavigate={handleNavigate}
        onSwitchMode={() => navigate(`/${id}/${currentVersion}`)}
        onTitleChange={setCurrentTitle}
        onVersionChange={null}
        onAddNode={handleAddNode}
        onSave={handleSave}
        onExport={handleExportJson}
        onDelete={() => {
          if (currentId !== null) {
            deleteFlowchart(currentId);
            toast.success("Flowchart deleted");
            navigate("/");
          }
        }}
        isUndoDisabled={commandStack.isUndoEmpty()}
        isRedoDisabled={commandStack.isRedoEmpty()}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* <div className="flex items-center gap-2 p-3 bg-card border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Button>
        <div className="flex-1 flex justify-between items-center">
          <HeaderTitle
            title={`${currentTitle}${hasChanges ? "*" : ""}`}
            onChange={setCurrentTitle}
          />
          <div className="flex gap-2">
            <h1 className="text-sm font-medium px-3 py-2.5 bg-black/5 rounded-lg">
              Version: {currentVersion}
            </h1>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  variant="outline"
                  type="button"
                  aria-label="Open menu"
                  className="p-1 aspect-square"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem className="gap-2" onClick={handleExportJson}>
                  <FileJson className="h-4 w-4" />
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    deleteFlowchart(currentId);
                    toast.success("Flowchart deleted");
                    navigate("/");
                  }}
                  className="text-destructive focus:text-destructive hover:!bg-destructive hover:!text-destructive-foreground gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete flowchart
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 bg-card border-b">
        <Button
          variant="default"
          size="sm"
          onClick={() => navigate(`/${id}/${currentVersion}`)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Switch to preview
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant="outline"
          size="sm"
          onClick={handleAddNode}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Node
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save Version
        </Button>
      </div> */}

      <div className="flex-1 relative">
        <FlowCanvas
          initialNodes={nodes}
          initialEdges={edges}
          styles={styles}
          onNodesChange={handleNodesChange}
          onNodeDragStart={handleNodeDragStart}
          onNodeDragStop={handleNodeDragStop}
          onEdgesChange={handleEdgesChange}
          onNodeClick={handleNodeClick}
          isEditable={true}
        />

        {selectedNode && (
          <NodeEditPanel
            nodeId={selectedNode.id}
            label={selectedNode.data.label}
            description={selectedNode.data.description}
            styleId={selectedNode.data.styleId}
            styles={styles}
            onClose={() => setSelectedNodeId(null)}
            onSave={handleSaveNode}
            onCreateStyle={handleCreateStyle}
            onDeleteNode={handleDeleteNode}
          />
        )}
      </div>
    </div>
  );
}
