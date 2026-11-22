import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Node, Edge } from "reactflow";
import { FlowCanvas } from "@/components/flowchart/FlowCanvas";
import { NodeEditPanel } from "@/components/flowchart/NodeEditPanel";
import { Button } from "@/components/ui/button";
import {
  getFlowchart,
  saveFlowchart,
  defaultStyles,
  NodeStyle,
  CreateNodeStyleInput,
  createNewFlowchart,
  getLatestVersion,
  deleteFlowchart,
  getAllStyles,
  getRecentlyUsedStyles,
  saveStyle,
  updateStyle,
  deleteStyle,
  markStyleAsRecentlyUsed,
  removeStyleFromRecentlyUsed,
} from "@/lib/storage";
import { toast } from "sonner";
import Toolbar from "@/components/flowchart/Toolbar";
import { CommandStack } from "@/commands/CommandStack";
import { CommandAddNode } from "@/commands/CommandAddNode";
import { CommandDeleteNode } from "@/commands/CommandDeleteNode";
import { CommandMoveNode } from "@/commands/CommandMoveNode";
import { CommandAddEdge } from "@/commands/CommandAddEdge";
import { CommandDeleteEdge } from "@/commands/CommandDeleteEdge";
import { CommandEditNode } from "@/commands/CommandEditNode";

export default function FlowchartEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const commandStack = useMemo(() => new CommandStack(), []);

  const [styles, setStyles] = useState<NodeStyle[]>(defaultStyles);
  const [recentStyles, setRecentStyles] = useState<NodeStyle[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>(null);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const nodeDragStartRef = useRef<{ id: string; x: number; y: number } | null>(
    null
  );

  const normalizeStyles = useCallback(
    (list: NodeStyle[]) =>
      (list ?? []).map((style) => ({
        ...style,
        assetType: style.assetType ?? (style.image ? "image" : "emoji"),
      })),
    []
  );

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);

        const [loadedStyles, loadedRecent] = await Promise.all([
          getAllStyles(),
          getRecentlyUsedStyles(),
        ]);
        if (!isMounted) return;

        const normalizedGlobalStyles =
          normalizeStyles(
            loadedStyles.length > 0 ? loadedStyles : defaultStyles
          ) ?? [];
        const normalizedRecentStyles = normalizeStyles(loadedRecent ?? []);

        if (!id) {
          setStyles(normalizedGlobalStyles);
          setRecentStyles(normalizedRecentStyles);
          const created = await createNewFlowchart();
          if (!isMounted) return;
          setCurrentId(created.id);
          setCurrentVersion(created.version);
          setCurrentTitle(created.title);
          setHasChanges(false);
          setLoadError(null);
          toast.success("New flowchart created");
          return;
        }

        const flowchartId = Number(id);
        if (Number.isNaN(flowchartId)) {
          toast.error("Invalid flowchart id");
          navigate("/");
          return;
        }

        const latestVersion = await getLatestVersion(flowchartId);
        const versionToLoad = latestVersion > 0 ? latestVersion : 1;
        const flowchart = await getFlowchart(flowchartId, versionToLoad);

        if (!isMounted) return;

        if (!flowchart) {
          toast.error("Flowchart not found");
          navigate("/");
          return;
        }

        const versionStyles = normalizeStyles(flowchart.styles ?? []);

        const stylesMap = new Map<string, NodeStyle>();
        normalizedGlobalStyles.forEach((style) => stylesMap.set(style.id, style));
        versionStyles.forEach((style) => stylesMap.set(style.id, style));
        const mergedStyles = Array.from(stylesMap.values());

        setNodes(
          flowchart.nodes.map((node) => ({
            ...node,
            type: "custom",
            data: {
              ...node.data,
              style: mergedStyles.find((s) => s.id === node.data.styleId),
            },
          }))
        );
        setEdges(flowchart.edges);
        setStyles(mergedStyles.length > 0 ? mergedStyles : normalizedGlobalStyles);
        setRecentStyles(normalizedRecentStyles);
        setCurrentId(flowchart.id);
        setCurrentTitle(flowchart.title);
        setCurrentVersion(flowchart.version);
        setHasChanges(false);
        setLoadError(null);
      } catch (error) {
        console.error("Failed to load flowchart", error);
        if (isMounted) {
          setLoadError("Failed to load flowchart");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [id, navigate, normalizeStyles]);

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
    if (styles.length === 0) {
      toast.error("No styles available. Create a style before adding nodes.");
      return;
    }

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
      const selectedNode = nodes.find((n) => n.id === selectedNodeId);
      if (!selectedNode) return;

      const newValue = {
        label,
        description,
        styleId,
      };

      const previousValue = {
        label: selectedNode.data.label,
        description: selectedNode.data.description,
        styleId: selectedNode.data.styleId,
      };

      const command = new CommandEditNode(
        {
          updateNode: (id, value) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === id
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        ...value,
                        style: styles.find((s) => s.id === value.styleId),
                      },
                    }
                  : node
              )
            );
          },
        },
        selectedNodeId,
        newValue,
        previousValue
      );

      commandStack.addCommand(command);
      setSelectedNodeId(null);
    },
    [nodes, selectedNodeId, styles, commandStack]
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

  const handleStyleUsage = useCallback(
    async (style: NodeStyle) => {
      const normalizedSource = normalizeStyles([style])[0] ?? style;
      try {
        const result = await markStyleAsRecentlyUsed(normalizedSource.id);
        const latest = normalizeStyles([{ ...normalizedSource, ...result }])[0] ?? normalizedSource;

        setRecentStyles((prev) => {
          const filtered = prev.filter((entry) => entry.id !== latest.id);
          return [latest, ...filtered];
        });

        setStyles((prevStyles) => {
          const exists = prevStyles.some((entry) => entry.id === latest.id);
          if (exists) {
            return prevStyles.map((entry) =>
              entry.id === latest.id ? { ...entry, ...latest } : entry
            );
          }
          return [...prevStyles, latest];
        });

        return latest;
      } catch (error) {
        console.error("Failed to update recently used styles", error);
        toast.error("Failed to update recently used styles");
        throw error;
      }
    },
    [markStyleAsRecentlyUsed, normalizeStyles]
  );

  const handleRemoveRecentStyle = useCallback(
    async (styleId: string) => {
      try {
        await removeStyleFromRecentlyUsed(styleId);
        setRecentStyles((prev) => prev.filter((style) => style.id !== styleId));
      } catch (error) {
        console.error("Failed to remove recently used style", error);
        toast.error("Failed to remove from recently used");
        throw error;
      }
    },
    [removeStyleFromRecentlyUsed]
  );

  const handleCreateStyle = useCallback(
    async (newStyle: CreateNodeStyleInput) => {
      try {
        const created = await saveStyle(newStyle);
        const normalizedCreated = normalizeStyles([created])[0] ?? created;
        const latest = await handleStyleUsage(normalizedCreated);
        toast.success("New style created");
        return latest ?? normalizedCreated;
      } catch (error) {
        console.error("Failed to create style", error);
        toast.error("Failed to create style");
        throw error;
      }
    },
    [handleStyleUsage, normalizeStyles]
  );

  const handleEditStyle = useCallback(
    async (styleId: string, updatedStyle: CreateNodeStyleInput) => {
      try {
        const result = await updateStyle(styleId, updatedStyle);
        const normalizedResult = normalizeStyles([result])[0] ?? result;
        setStyles((prevStyles) => {
          const exists = prevStyles.some((style) => style.id === styleId);
          if (!exists) {
            return [...prevStyles, normalizedResult];
          }
          return prevStyles.map((style) =>
            style.id === styleId ? { ...style, ...normalizedResult } : style
          );
        });
        setRecentStyles((prev) =>
          prev.map((style) =>
            style.id === styleId ? { ...style, ...normalizedResult } : style
          )
        );
        setNodes((prevNodes) =>
          prevNodes.map((node) =>
            node.data.styleId === styleId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    style: normalizedResult,
                  },
                }
              : node
          )
        );
        toast.success("Style updated");
        return normalizedResult;
      } catch (error) {
        console.error("Failed to update style", error);
        toast.error("Failed to update style");
        throw error;
      }
    },
    [normalizeStyles, updateStyle]
  );

  const handleDeleteStyle = useCallback(async (styleId: string) => {
    try {
      await deleteStyle(styleId);
      setStyles((prevStyles) =>
        prevStyles.filter((style) => style.id !== styleId)
      );
      setRecentStyles((prev) => prev.filter((style) => style.id !== styleId));
      toast.success("Style deleted");
    } catch (error) {
      console.error("Failed to delete style", error);
      toast.error("Failed to delete style");
      throw error;
    }
  }, [deleteStyle]);

  const handleDeleteFlowchart = useCallback(async () => {
    if (currentId === null) return;
    try {
      await deleteFlowchart(currentId);
      toast.success("Flowchart deleted");
      navigate("/");
    } catch (error) {
      console.error("Failed to delete flowchart", error);
      toast.error("Failed to delete flowchart");
    }
  }, [currentId, navigate]);

  const handleSave = useCallback(async () => {
    if (currentId === null) {
      toast.error("No flowchart to save");
      return;
    }

    try {
      const cleanNodes = nodes.map(({ data, ...node }) => ({
        ...node,
        data: {
          label: data.label,
          description: data.description,
          styleId: data.styleId,
        },
      }));

      const result = await saveFlowchart(
        currentId,
        currentTitle ?? `Flowchart #${currentId}`,
        cleanNodes,
        edges,
        styles
      );
      setCurrentVersion(result.version);
      setHasChanges(false);
      toast.success(`Saved as version ${result.version}`);
      navigate(`/${currentId}/${result.version}`, { replace: true });
    } catch (error) {
      console.error("Failed to save flowchart", error);
      toast.error("Failed to save flowchart");
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
      // userAgentData may not be present on all TS lib versions / browsers
      const uaData = (
        navigator as unknown as {
          userAgentData?: { platform?: string };
        }
      ).userAgentData;
      const isMac =
        uaData?.platform?.toLowerCase().includes("mac") ||
        navigator.platform?.toLowerCase().includes("mac");
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
        onSwitchMode={() => handleNavigate(`/${id}/${currentVersion}`)}
        onTitleChange={setCurrentTitle}
        onVersionChange={null}
        onAddNode={handleAddNode}
        onSave={handleSave}
        onExport={handleExportJson}
        onDelete={handleDeleteFlowchart}
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
                  className="text-destructive focus:text-destructive hover:bg-destructive! hover:text-destructive-foreground! gap-2"
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
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm">Loading flowchart…</p>
          </div>
        ) : loadError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-lg font-semibold">Unable to load this flowchart</p>
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/")}>
                Back home
              </Button>
              <Button onClick={() => window.location.reload()}>Try again</Button>
            </div>
          </div>
        ) : (
          <>
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
                recentStyles={recentStyles}
                onClose={() => setSelectedNodeId(null)}
                onSave={handleSaveNode}
                onCreateStyle={handleCreateStyle}
                onEditStyle={handleEditStyle}
                onDeleteStyle={handleDeleteStyle}
                onStyleSelected={handleStyleUsage}
                onRemoveRecentlyUsed={handleRemoveRecentStyle}
                onDeleteNode={handleDeleteNode}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
