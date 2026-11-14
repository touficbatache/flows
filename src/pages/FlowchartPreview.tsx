import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Node, Edge } from "reactflow";
import { FlowCanvas } from "@/components/flowchart/FlowCanvas";
import {
  getFlowchart,
  getAllVersions,
  deleteFlowchart,
  NodeStyle,
  defaultStyles,
  getAllStyles,
} from "@/lib/storage";
import { toast } from "sonner";
import Toolbar from "@/components/flowchart/Toolbar";
import { Button } from "@/components/ui/button";

export default function FlowchartPreview() {
  const { id, version } = useParams();
  const navigate = useNavigate();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [styles, setStyles] = useState<NodeStyle[]>(defaultStyles);
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const [currentTitle, setCurrentTitle] = useState<string>(null);
  const [availableVersions, setAvailableVersions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      if (!id) {
        setIsLoading(false);
        setError("Missing flowchart id");
        return;
      }

      try {
        setIsLoading(true);
        const flowchartId = Number(id);
        if (Number.isNaN(flowchartId)) {
          toast.error("Invalid flowchart id");
          navigate("/");
          return;
        }

        const [globalStyles, versions] = await Promise.all([
          getAllStyles(),
          getAllVersions(flowchartId),
        ]);

        if (!isMounted) return;

        const normalizedGlobalStyles = normalizeStyles(
          globalStyles.length > 0 ? globalStyles : defaultStyles
        );
        const versionNumbers = versions.map((v) => v.version);
        setAvailableVersions(versionNumbers);

        const requestedVersion = version ? Number(version) : undefined;
        const resolvedVersion =
          requestedVersion && versionNumbers.includes(requestedVersion)
            ? requestedVersion
            : versionNumbers[0];

        if (!resolvedVersion) {
          toast.error("No versions found");
          navigate("/");
          return;
        }

        const flowchart = await getFlowchart(flowchartId, resolvedVersion);
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
        setStyles(mergedStyles);
        setCurrentVersion(flowchart.version);
        setCurrentTitle(flowchart.title);
        setError(null);
      } catch (err) {
        console.error("Failed to load flowchart preview", err);
        if (isMounted) {
          setError("Failed to load flowchart");
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
  }, [id, version, navigate, normalizeStyles]);

  const handleVersionChange = (newVersion: string) => {
    navigate(`/${id}/${newVersion}`);
  };

  const handleDelete = useCallback(async () => {
    if (!id) return;
    try {
      await deleteFlowchart(Number(id));
      toast.success("Flowchart deleted");
      navigate("/");
    } catch (err) {
      console.error("Failed to delete flowchart", err);
      toast.error("Failed to delete flowchart");
    }
  }, [id, navigate]);

  const handleExportJson = () => {
    const data = {
      id: Number(id),
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
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowchart-${id}-v${currentVersion}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported");
  };

  return (
    <div className="flex flex-col h-screen">
      <Toolbar
        mode="preview"
        title={currentTitle ?? "Flowchart"}
        selectedVersion={currentVersion}
        versions={availableVersions}
        hasChanges={false}
        hasPreview={false}
        isUndoDisabled={null}
        isRedoDisabled={null}
        handleNavigate={navigate}
        onSwitchMode={() => navigate(`/${id}/edit`)}
        onTitleChange={null}
        onVersionChange={handleVersionChange}
        onAddNode={null}
        onSave={null}
        onExport={handleExportJson}
        onDelete={handleDelete}
        onUndo={null}
        onRedo={null}
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
        <div className="flex-1">
          <h1 className="text-sm font-medium">{currentTitle} - Preview</h1>
        </div>
        <Select
          value={String(currentVersion)}
          onValueChange={handleVersionChange}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Version" />
          </SelectTrigger>
          <SelectContent>
            {availableVersions.map((v) => (
              <SelectItem key={v} value={String(v)}>
                Version {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 p-3 bg-card border-b">
        <Button
          variant="default"
          size="sm"
          onClick={() => navigate(`/${id}/edit`)}
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit flowchart
        </Button>
      </div> */}

      <div className="flex-1 relative">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm">Loading flowchart…</p>
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-4">
            <p className="text-lg font-semibold">Unable to display this flowchart</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/")}>
                Back home
              </Button>
              <Button onClick={() => window.location.reload()}>Try again</Button>
            </div>
          </div>
        ) : (
          <FlowCanvas
            initialNodes={nodes}
            initialEdges={edges}
            styles={styles}
            isEditable={false}
          />
        )}
      </div>
    </div>
  );
}
