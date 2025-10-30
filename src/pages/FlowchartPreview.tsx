import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Node, Edge } from "reactflow";
import { FlowCanvas } from "@/components/flowchart/FlowCanvas";
import {
  getFlowchart,
  getAllVersions,
  deleteFlowchart,
  getAllStyles,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, FileJson, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Toolbar from "@/components/flowchart/Toolbar";

export default function FlowchartPreview() {
  const { id, version } = useParams();
  const navigate = useNavigate();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const [currentTitle, setCurrentTitle] = useState<string>(null);
  const [availableVersions, setAvailableVersions] = useState<number[]>([]);

  useEffect(() => {
    if (id) {
      const versions = getAllVersions(Number(id));
      setAvailableVersions(versions.map((v) => v.version));

      const versionToLoad = version ? Number(version) : versions[0]?.version;

      if (versionToLoad) {
        const flowchart = getFlowchart(Number(id), versionToLoad);
        if (flowchart) {
          setNodes(
            flowchart.nodes.map((node) => ({
              ...node,
              type: "custom",
              data: {
                ...node.data,
                style: getAllStyles().find((s) => s.id === node.data.styleId),
              },
            }))
          );
          setEdges(flowchart.edges);
          setCurrentVersion(flowchart.version);
          setCurrentTitle(flowchart.title);
        } else {
          toast.error("Flowchart not found");
          navigate("/");
        }
      } else {
        toast.error("No versions found");
        navigate("/");
      }
    }
  }, [id, version, navigate]);

  const handleVersionChange = (newVersion: string) => {
    navigate(`/${id}/${newVersion}`);
  };

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
        title={currentTitle}
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
        onDelete={() => {
          if (id !== null) {
            deleteFlowchart(Number(id));
            toast.success("Flowchart deleted");
            navigate("/");
          }
        }}
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

      <div className="flex-1">
        <FlowCanvas
          initialNodes={nodes}
          initialEdges={edges}
          styles={[]}
          isEditable={false}
        />
      </div>
    </div>
  );
}
