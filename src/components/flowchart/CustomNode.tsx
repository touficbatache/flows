import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { cn } from "@/lib/utils";

export const CustomNode = memo(({ data, selected }: NodeProps) => {
  const style = data.style || {};
  const assetType =
    style.assetType ??
    (style.image ? "image" : style.icon ? "emoji" : undefined);
  const showImage = assetType === "image" && style.image;

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 bg-card shadow-md transition-all min-w-[180px]",
        selected && "ring-2 ring-primary ring-offset-2"
      )}
      style={{
        borderColor: style.color || "hsl(var(--border))",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-primary"
      />

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg overflow-hidden",
            showImage ? "bg-transparent" : "text-2xl"
          )}
          style={{
            backgroundColor: showImage
              ? "transparent"
              : style.color
              ? `${style.color}20`
              : "hsl(var(--muted))",
          }}
        >
          {showImage ? (
            <img
              src={style.image}
              alt={style.name || data.label || "Node"}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            style.icon || "📄"
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate">
            {data.label || style.name || "Untitled Node"}
            {/* {selected ? "yes" : "no"} */}
          </h3>
          {data.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {data.description}
            </p>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-primary"
      />
    </div>
  );
});

CustomNode.displayName = "CustomNode";
