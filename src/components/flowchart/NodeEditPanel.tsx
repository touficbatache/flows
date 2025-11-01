import { useState, useEffect, ChangeEvent } from "react";
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
  onEditStyle: (styleId: string, updatedStyle: NodeStyle) => void;
  onDeleteStyle: (styleId: string) => void;
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
  onEditStyle,
  onDeleteStyle,
  onDeleteNode,
}: NodeEditPanelProps) => {
  const [editLabel, setEditLabel] = useState(label);
  const [editDescription, setEditDescription] = useState(description);
  const [editStyleId, setEditStyleId] = useState(styleId);
  const [isCreatingStyle, setIsCreatingStyle] = useState(false);
  const [newStyleName, setNewStyleName] = useState("");
  const [newStyleIcon, setNewStyleIcon] = useState("");
  const [newStyleColor, setNewStyleColor] = useState("#3b82f6");
  const [newStyleAssetType, setNewStyleAssetType] = useState<"emoji" | "image">(
    "emoji"
  );
  const [newStyleImageFileName, setNewStyleImageFileName] = useState<
    string | null
  >(null);
  const [newStyleImagePreview, setNewStyleImagePreview] = useState<
    string | null
  >(null);
  const [editingStyle, setEditingStyle] = useState<NodeStyle | null>(null);

  useEffect(() => {
    setEditLabel(label);
    setEditDescription(description);
    setEditStyleId(styleId);
  }, [nodeId, label, description, styleId]);

  const handleSave = () => {
    onSave(editLabel, editDescription, editStyleId);
  };

  const resetStyleCreation = () => {
    setIsCreatingStyle(false);
    setNewStyleName("");
    setNewStyleIcon("");
    setNewStyleColor("#3b82f6");
    setNewStyleAssetType("emoji");
    setNewStyleImageFileName(null);
    setNewStyleImagePreview(null);
  };

  const handleStyleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setNewStyleImageFileName(null);
      setNewStyleImagePreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result;
      if (typeof result === "string") {
        setNewStyleImagePreview(result);
      }
    };
    reader.readAsDataURL(file);
    setNewStyleImageFileName(file.name);
  };

  useEffect(() => {
    if (
      editingStyle &&
      editingStyle.assetType === "image" &&
      editingStyle.image
    ) {
      setNewStyleImageFileName(editingStyle.imageName);
      setNewStyleImagePreview(editingStyle.image);
    } else {
      setNewStyleImageFileName(null);
      setNewStyleImagePreview(null);
    }
  }, [editingStyle, newStyleAssetType]);

  const handleCreateStyle = () => {
    if (!newStyleName) return;

    const baseStyle = {
      id: `custom-${Date.now()}`,
      name: newStyleName,
      color: newStyleColor,
    };

    if (newStyleAssetType === "emoji") {
      if (!newStyleIcon) return;

      const newStyle: NodeStyle = {
        ...baseStyle,
        icon: newStyleIcon,
        assetType: "emoji",
      };
      onCreateStyle(newStyle);
      setIsCreatingStyle(false);
      setNewStyleName("");
      setNewStyleIcon("");
      setNewStyleColor("#3b82f6");
      resetStyleCreation();
      return;
    }

    if (!newStyleImagePreview || !newStyleImageFileName) return;

    const newStyle: NodeStyle = {
      ...baseStyle,
      image: newStyleImagePreview,
      imageName: `images/${newStyleImageFileName}`,
      assetType: "image",
    };

    onCreateStyle(newStyle);
    setEditStyleId(newStyle.id);
    resetStyleCreation();
  };

  const isCreateDisabled =
    !newStyleName ||
    (newStyleAssetType === "emoji" && !newStyleIcon) ||
    (newStyleAssetType === "image" && !newStyleImagePreview);

  const handleEditStyleSave = () => {
    if (editingStyle) {
      const updatedStyle: NodeStyle = {
        ...editingStyle,
        name: newStyleName || editingStyle.name,
        icon: newStyleIcon || editingStyle.icon,
        color: newStyleColor || editingStyle.color,
      };
      onEditStyle(updatedStyle.id, updatedStyle);
      setEditingStyle(null);
      setNewStyleName("");
      setNewStyleIcon("");
      setNewStyleColor("#3b82f6");
    }
  };

  const handleEditStyleClick = (style: NodeStyle) => {
    setEditingStyle(style);
    setNewStyleName(style.name);
    setNewStyleIcon(style.icon);
    setNewStyleColor(style.color);
    setNewStyleAssetType(style.assetType ?? (style.image ? "image" : "emoji"));
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
              <ContextMenu key={style.id}>
                <ContextMenuTrigger>
                  <button
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
                    <div className="flex items-center justify-center mb-1 h-10">
                      {style.image &&
                      (style.assetType === "image" || !style.assetType) ? (
                        <img
                          src={style.image}
                          alt={style.name}
                          className="h-10 w-10 object-contain rounded"
                        />
                      ) : (
                        <span className="text-2xl">{style.icon || "📄"}</span>
                      )}
                    </div>
                    <div className="text-xs font-medium truncate">
                      {style.name}
                    </div>
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                  <ContextMenuItem
                    className="gap-2"
                    onClick={() => handleEditStyleClick(style)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </ContextMenuItem>
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive hover:!bg-destructive hover:!text-destructive-foreground gap-2"
                    onClick={() => onDeleteStyle(style.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </div>

        {!editingStyle &&
          (!isCreatingStyle ? (
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
                <Label>Asset Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      newStyleAssetType === "emoji" ? "default" : "outline"
                    }
                    onClick={() => {
                      setNewStyleAssetType("emoji");
                      setNewStyleImageFileName(null);
                      setNewStyleImagePreview(null);
                    }}
                    className="flex-1"
                  >
                    Emoji Icon
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      newStyleAssetType === "image" ? "default" : "outline"
                    }
                    onClick={() => {
                      setNewStyleAssetType("image");
                      setNewStyleIcon("");
                    }}
                    className="flex-1"
                  >
                    Upload Image
                  </Button>
                </div>
              </div>

              {newStyleAssetType === "emoji" ? (
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
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="styleImage">Upload image</Label>
                  <Input
                    id="styleImage"
                    type="file"
                    accept="image/*"
                    onChange={handleStyleImageChange}
                  />
                  {newStyleImagePreview && (
                    <div className="rounded-md border bg-background p-2 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">
                        Preview ({newStyleImageFileName})
                      </p>
                      <img
                        src={newStyleImagePreview}
                        alt={newStyleName}
                        className="mt-2 h-24 w-full rounded-md object-contain bg-white"
                      />
                      <p className="mt-2">
                        Image stored under <code>images/</code> when saved.
                      </p>
                    </div>
                  )}
                </div>
              )}

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
                  onClick={resetStyleCreation}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleCreateStyle}
                  disabled={isCreateDisabled}
                >
                  Create
                </Button>
              </div>
            </div>
          ))}

        {editingStyle && (
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
              <Label>Asset Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={
                    newStyleAssetType === "emoji" ? "default" : "outline"
                  }
                  onClick={() => {
                    setNewStyleAssetType("emoji");
                    setNewStyleImageFileName(null);
                    setNewStyleImagePreview(null);
                  }}
                  className="flex-1"
                >
                  Emoji Icon
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    newStyleAssetType === "image" ? "default" : "outline"
                  }
                  onClick={() => {
                    setNewStyleAssetType("image");
                    setNewStyleIcon("");
                  }}
                  className="flex-1"
                >
                  Upload Image
                </Button>
              </div>
            </div>

            {newStyleAssetType === "emoji" ? (
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
            ) : (
              <div className="space-y-2">
                <Label htmlFor="styleImage">Upload image</Label>
                <Input
                  id="styleImage"
                  type="file"
                  accept="image/*"
                  onChange={handleStyleImageChange}
                />
                {newStyleImagePreview && (
                  <div className="rounded-md border bg-background p-2 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">
                      Preview ({newStyleImageFileName})
                    </p>
                    <img
                      src={newStyleImagePreview}
                      alt={newStyleName}
                      className="mt-2 h-24 w-full rounded-md object-contain bg-white"
                    />
                    <p className="mt-2">
                      Image stored under <code>images/</code> when saved.
                    </p>
                  </div>
                )}
              </div>
            )}

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
                onClick={() => setEditingStyle(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleEditStyleSave}
                disabled={isCreateDisabled}
              >
                Save Changes
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
