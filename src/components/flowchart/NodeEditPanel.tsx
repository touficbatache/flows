import { useState, useEffect } from "react";
import { X, Trash2, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NodeStyle } from "@/lib/storage";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface NodeEditPanelProps {
  nodeId: string;
  label: string;
  description: string;
  styleId: string;
  styles: NodeStyle[];
  onClose: () => void;
  onSave: (label: string, description: string, styleId: string) => void;
  onCreateStyle: (style: NodeStyle) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const NodeEditPanel = ({
  nodeId,
  label,
  description,
  styleId,
  styles,
  onClose,
  onSave,
  onCreateStyle,
  onDeleteNode,
}: NodeEditPanelProps) => {
  const [editLabel, setEditLabel] = useState(label);
  const [editDescription, setEditDescription] = useState(description);
  const [editStyleId, setEditStyleId] = useState(styleId);
  const [isCreatingStyle, setIsCreatingStyle] = useState(false);
  const [newStyleName, setNewStyleName] = useState("");
  const [newStyleIcon, setNewStyleIcon] = useState("");
  const [newStyleColor, setNewStyleColor] = useState("#3b82f6");

  useEffect(() => {
    setEditLabel(label);
    setEditDescription(description);
    setEditStyleId(styleId);
  }, [nodeId, label, description, styleId]);

  const handleSave = () => {
    onSave(editLabel, editDescription, editStyleId);
  };

  const handleCreateStyle = () => {
    if (newStyleName && newStyleIcon) {
      const newStyle: NodeStyle = {
        id: `custom-${Date.now()}`,
        name: newStyleName,
        icon: newStyleIcon,
        color: newStyleColor,
      };
      onCreateStyle(newStyle);
      setEditStyleId(newStyle.id);
      setIsCreatingStyle(false);
      setNewStyleName("");
      setNewStyleIcon("");
      setNewStyleColor("#3b82f6");
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-card border-l shadow-lg z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Edit Node</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4 overflow-y-scroll">
        <div className="space-y-2">
          <Label htmlFor="label">Title</Label>
          <Input
            id="label"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            placeholder="Node title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Node description"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Node Style</Label>
          <div className="grid grid-cols-2 gap-2">
            {styles.map((style) => (
              <ContextMenu>
                <ContextMenuTrigger>
                  <button
                    key={style.id}
                    onClick={() => setEditStyleId(style.id)}
                    className={`w-full p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                      editStyleId === style.id
                        ? "ring-2 ring-primary ring-offset-2"
                        : "hover:border-primary/50"
                    }`}
                    style={{
                      borderColor: style.color,
                      backgroundColor: `${style.color}10`,
                    }}
                  >
                    <div className="text-2xl mb-1">{style.icon}</div>
                    <div className="text-xs font-medium truncate">
                      {style.name}
                    </div>
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </ContextMenuItem>
                  <ContextMenuItem className="text-destructive focus:text-destructive hover:!bg-destructive hover:!text-destructive-foreground gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </div>

        {!isCreatingStyle ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsCreatingStyle(true)}
          >
            <Plus className="h-4 w-4" /> Create New Style
          </Button>
        ) : (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="styleName">Style Name</Label>
              <Input
                id="styleName"
                value={newStyleName}
                onChange={(e) => setNewStyleName(e.target.value)}
                placeholder="e.g., Email Service"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="styleIcon">Icon (emoji)</Label>
              <Input
                id="styleIcon"
                value={newStyleIcon}
                onChange={(e) => setNewStyleIcon(e.target.value)}
                placeholder="e.g., 📧"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="styleColor">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="styleColor"
                  type="color"
                  value={newStyleColor}
                  onChange={(e) => setNewStyleColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={newStyleColor}
                  onChange={(e) => setNewStyleColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setIsCreatingStyle(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleCreateStyle}
                disabled={!newStyleName || !newStyleIcon}
              >
                Create
              </Button>
            </div>
          </div>
        )}

        <Button
          variant="destructiveOutline"
          className="w-full"
          onClick={() => onDeleteNode(nodeId)}
        >
          <Trash2 className="h-4 w-4" /> Delete node
        </Button>
      </div>

      <div className="p-4 border-t">
        <Button onClick={handleSave} className="w-full">
          Save Changes
        </Button>
      </div>
    </div>
  );
};
