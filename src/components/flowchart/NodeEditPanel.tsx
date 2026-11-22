import { useState, useEffect, useRef, ChangeEvent } from "react";
import { X, Trash, Plus, SquarePen, RotateCcwClock, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NodeStyle, CreateNodeStyleInput, searchStyles } from "@/lib/storage";
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
  recentStyles: NodeStyle[];
  onClose: () => void;
  onSave: (label: string, description: string, styleId: string) => void;
  onCreateStyle: (style: CreateNodeStyleInput) => Promise<NodeStyle>;
  onEditStyle: (
    styleId: string,
    updatedStyle: CreateNodeStyleInput
  ) => Promise<NodeStyle>;
  onDeleteStyle: (styleId: string) => Promise<void>;
  onStyleSelected: (style: NodeStyle) => Promise<NodeStyle | void>;
  onRemoveRecentlyUsed: (styleId: string) => Promise<void>;
  onDeleteNode: (nodeId: string) => void;
}

export const NodeEditPanel = ({
  nodeId,
  label,
  description,
  styleId,
  styles,
  recentStyles,
  onClose,
  onSave,
  onCreateStyle,
  onEditStyle,
  onDeleteStyle,
  onStyleSelected,
  onRemoveRecentlyUsed,
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
  const [isStyleSubmitting, setIsStyleSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NodeStyle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isApplyingStyle, setIsApplyingStyle] = useState(false);
  const searchTokenRef = useRef(0);

  useEffect(() => {
    setEditLabel(label);
    setEditDescription(description);
    setEditStyleId(styleId);
  }, [nodeId, label, description, styleId]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      searchTokenRef.current += 1;
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const token = ++searchTokenRef.current;
    setIsSearching(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await searchStyles(trimmed);
        if (searchTokenRef.current === token) {
          setSearchResults(results);
        }
      } catch (error) {
        console.error("Failed to search styles", error);
        if (searchTokenRef.current === token) {
          setSearchResults([]);
        }
      } finally {
        if (searchTokenRef.current === token) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery, searchStyles]);

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
      setNewStyleImageFileName(
        editingStyle.imageName
          ? editingStyle.imageName.replace(/^images\//, "")
          : null
      );
      setNewStyleImagePreview(editingStyle.image);
    } else {
      setNewStyleImageFileName(null);
      setNewStyleImagePreview(null);
    }
  }, [editingStyle, newStyleAssetType]);

  const handleCreateStyle = async () => {
    if (!newStyleName || isStyleSubmitting) return;

    const baseStyle: CreateNodeStyleInput = {
      name: newStyleName,
      color: newStyleColor,
    };

    try {
      setIsStyleSubmitting(true);

      if (newStyleAssetType === "emoji") {
        if (!newStyleIcon) return;

        const created = await onCreateStyle({
          ...baseStyle,
          icon: newStyleIcon,
          assetType: "emoji",
          image: null,
          imageName: null,
        });
        setEditStyleId(created.id);
        resetStyleCreation();
        return;
      }

      if (!newStyleImagePreview || !newStyleImageFileName) return;

      const created = await onCreateStyle({
        ...baseStyle,
        icon: null,
        image: newStyleImagePreview,
        imageName: `images/${newStyleImageFileName}`,
        assetType: "image",
      });
      setEditStyleId(created.id);
      resetStyleCreation();
    } catch (error) {
      console.error("Failed to create style", error);
    } finally {
      setIsStyleSubmitting(false);
    }
  };

  const isCreateDisabled =
    !newStyleName ||
    (newStyleAssetType === "emoji" && !newStyleIcon) ||
    (newStyleAssetType === "image" && !newStyleImagePreview) ||
    isStyleSubmitting;

  const handleEditStyleSave = async () => {
    if (!editingStyle || isStyleSubmitting) return;

    const base: CreateNodeStyleInput = {
      name: newStyleName || editingStyle.name,
      color: newStyleColor || editingStyle.color,
    };

    const buildPayload = (): CreateNodeStyleInput | null => {
      if (newStyleAssetType === "emoji") {
        const iconValue = newStyleIcon || editingStyle.icon;
        if (!iconValue) {
          return null;
        }
        return {
          ...base,
          icon: iconValue,
          image: null,
          imageName: null,
          assetType: "emoji",
        };
      }

      const imageValue =
        newStyleImagePreview ?? editingStyle.image ?? undefined;
      const imageNameValue = newStyleImageFileName
        ? `images/${newStyleImageFileName}`
        : editingStyle.imageName ?? undefined;

      if (!imageValue || !imageNameValue) {
        return null;
      }

      return {
        ...base,
        icon: null,
        image: imageValue,
        imageName: imageNameValue,
        assetType: "image",
      };
    };

    const payload = buildPayload();
    if (!payload) return;

    try {
      setIsStyleSubmitting(true);
      await onEditStyle(editingStyle.id, payload);
      setEditingStyle(null);
      setNewStyleName("");
      setNewStyleIcon("");
      setNewStyleColor("#3b82f6");
      setNewStyleImageFileName(null);
      setNewStyleImagePreview(null);
    } catch (error) {
      console.error("Failed to update style", error);
    } finally {
      setIsStyleSubmitting(false);
    }
  };

  const handleEditStyleClick = (style: NodeStyle) => {
    setEditingStyle(style);
    setNewStyleName(style.name);
    setNewStyleIcon(style.icon);
    setNewStyleColor(style.color);
    setNewStyleAssetType(style.assetType ?? (style.image ? "image" : "emoji"));
  };

  const handleStyleSelect = async (style: NodeStyle) => {
    if (isApplyingStyle) return;
    try {
      setIsApplyingStyle(true);
      const result = await onStyleSelected(style);
      const resolved = result ?? style;
      setEditStyleId(resolved.id);
      if (searchQuery) {
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Failed to apply style", error);
    } finally {
      setIsApplyingStyle(false);
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

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="styleSearch">Search Styles</Label>
            <div className="relative">
              <Input
                id="styleSearch"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search styles…"
                autoComplete="off"
              />
              {searchQuery.trim().length > 0 &&
                searchQuery.trim().length < 2 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Type at least 2 characters to search.
                  </p>
                )}
              {searchQuery.trim().length >= 2 && (
                <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-64 overflow-y-auto rounded-md border bg-popover shadow-lg">
                  {isSearching ? (
                    <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Searching…
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => handleStyleSelect(style)}
                        disabled={isApplyingStyle}
                        className={`flex w-full items-center gap-3 p-3 text-left text-sm transition hover:bg-muted ${
                          editStyleId === style.id ? "bg-muted" : ""
                        } ${isApplyingStyle ? "opacity-60" : ""}`}
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-md border"
                          style={{ borderColor: style.color }}
                        >
                          {style.image &&
                          (style.assetType === "image" || !style.assetType) ? (
                            <img
                              src={style.image}
                              alt={style.name}
                              className="h-6 w-6 object-contain rounded"
                            />
                          ) : (
                            <span className="text-lg">
                              {style.icon || "📄"}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col">
                          <span className="font-medium">{style.name}</span>
                          {style.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {style.description}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground">
                      No styles found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Recently Used</Label>
            {recentStyles.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {recentStyles.map((style) => (
                  <ContextMenu key={`${style.id}-recent`}>
                    <ContextMenuTrigger>
                      <button
                        type="button"
                        onClick={() => handleStyleSelect(style)}
                        disabled={isApplyingStyle}
                        className={`w-full rounded-lg border-2 p-3 transition-all hover:scale-105 ${
                          editStyleId === style.id
                            ? "ring-2 ring-primary ring-offset-2"
                            : "hover:border-primary/50"
                        } ${isApplyingStyle ? "opacity-60" : ""}`}
                        style={{
                          borderColor: style.color,
                          backgroundColor: `${style.color}10`,
                        }}
                      >
                        <div className="mb-1 flex h-10 items-center justify-center">
                          {style.image &&
                          (style.assetType === "image" || !style.assetType) ? (
                            <img
                              src={style.image}
                              alt={style.name}
                              className="h-10 w-10 rounded object-contain"
                            />
                          ) : (
                            <span className="text-2xl">
                              {style.icon || "📄"}
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs font-medium">
                          {style.name}
                        </div>
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-56">
                      {style.isCustom ? (
                        <>
                          <ContextMenuItem
                            className="gap-2"
                            onClick={() => handleEditStyleClick(style)}
                          >
                            <SquarePen className="h-4 w-4" />
                            Edit
                          </ContextMenuItem>
                          <ContextMenuItem
                            className="gap-2 text-destructive focus:text-destructive hover:bg-destructive! hover:text-destructive-foreground!"
                            onClick={async () => {
                              try {
                                await onDeleteStyle(style.id);
                                if (editingStyle?.id === style.id) {
                                  setEditingStyle(null);
                                  resetStyleCreation();
                                }
                                setEditStyleId((prev) => {
                                  if (prev !== style.id) return prev;
                                  const fallback =
                                    recentStyles.find(
                                      (candidate) => candidate.id !== style.id
                                    ) ??
                                    styles.find(
                                      (candidate) => candidate.id !== style.id
                                    );
                                  return fallback ? fallback.id : "";
                                });
                              } catch (error) {
                                console.error("Failed to delete style", error);
                              }
                            }}
                          >
                            <Trash className="h-4 w-4" />
                            Delete
                          </ContextMenuItem>
                        </>
                      ) : null}
                      <ContextMenuItem
                        className="gap-2 text-muted-foreground focus:text-muted-foreground"
                        onClick={async () => {
                          try {
                            await onRemoveRecentlyUsed(style.id);
                          } catch (error) {
                            console.error(
                              "Failed to remove style from recently used",
                              error
                            );
                          }
                        }}
                      >
                        <RotateCcwClock className="h-4 w-4" />
                        Remove from Recently Used
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No recently used styles yet. Use the search above to pick one.
              </p>
            )}
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
          <Trash className="h-4 w-4" /> Delete node
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
