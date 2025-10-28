import { Plus, Save, Eye, Edit, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ToolbarProps {
  isPreviewMode: boolean;
  onToggleMode: () => void;
  onAddNode: () => void;
  onSave: () => void;
  onExportJson: () => void;
  canSave: boolean;
}

export const Toolbar = ({
  isPreviewMode,
  onToggleMode,
  onAddNode,
  onSave,
  onExportJson,
  canSave,
}: ToolbarProps) => {
  return (
    <div className="flex items-center gap-2 p-3 bg-card border-b">
      <Button
        variant={isPreviewMode ? "outline" : "default"}
        size="sm"
        onClick={onToggleMode}
        className="gap-2"
      >
        {isPreviewMode ? (
          <>
            <Edit className="h-4 w-4" />
            Edit Mode
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" />
            Preview Mode
          </>
        )}
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {!isPreviewMode && (
        <>
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
            onClick={onSave}
            disabled={!canSave}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save Version
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onExportJson}
        className="gap-2 ml-auto"
      >
        <FileJson className="h-4 w-4" />
        Export JSON
      </Button>
    </div>
  );
};
