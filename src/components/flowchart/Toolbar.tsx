import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Save,
  Eye,
  FileJson,
  Trash2,
  MoreVertical,
  Edit,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HeaderTitle } from "@/components/flowchart/HeaderTitle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ToolbarProps {
  mode: "edit" | "preview";
  title: string;
  selectedVersion: number;
  versions: number[];
  hasChanges: boolean;
  hasPreview: boolean;
  isUndoDisabled: boolean;
  isRedoDisabled: boolean;
  handleNavigate: (path: string) => void;
  onSwitchMode: (mode: "edit" | "preview") => void;
  onTitleChange: (newTitle: string) => void;
  onVersionChange: (version: string) => void;
  onAddNode: () => void;
  onSave: () => void;
  onExport: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export default function Toolbar({
  mode,
  title,
  selectedVersion,
  versions,
  hasChanges,
  hasPreview,
  isUndoDisabled,
  isRedoDisabled,
  handleNavigate,
  onSwitchMode,
  onTitleChange,
  onVersionChange,
  onAddNode,
  onSave,
  onExport,
  onDelete,
  onUndo,
  onRedo,
}: ToolbarProps) {
  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-card border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNavigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Button>
        <div className="flex-1 flex justify-between items-center">
          {mode === "edit" ? (
            <HeaderTitle title={title} onChange={onTitleChange} />
          ) : (
            <h1 className="text-sm font-medium">{title} - Preview</h1>
          )}
          <div className="flex gap-2">
            {mode === "edit" ? (
              <h1 className="text-sm font-medium px-3 py-2.5 bg-black/5 rounded-lg">
                Version: {selectedVersion}
              </h1>
            ) : (
              <Select
                value={String(selectedVersion)}
                onValueChange={onVersionChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v} value={String(v)}>
                      Version {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
                <DropdownMenuItem className="gap-2" onClick={onExport}>
                  <FileJson className="h-4 w-4" />
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
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
        {mode === "edit" ? (
          <>
            {hasPreview && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onSwitchMode("preview")}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Switch to preview
                </Button>

                <Separator orientation="vertical" className="h-6" />
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onAddNode}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Node
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={isUndoDisabled}
              className="gap-2"
            >
              <Undo className="h-4 w-4" />
              Undo
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={isRedoDisabled}
              className="gap-2"
            >
              <Redo className="h-4 w-4" />
              Redo
            </Button>

            <div className="flex-1" />

            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={!hasChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Version
            </Button>
          </>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => onSwitchMode("edit")}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit flowchart
          </Button>
        )}
      </div>
    </>
  );
}
