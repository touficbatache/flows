import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeaderTitleProps {
  title: string;
  /** Called when the user edits and saves the title. Receives the new title. */
  onChange?: (newTitle: string) => void;
}

export const HeaderTitle = ({ title, onChange }: HeaderTitleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // keep local value in sync with prop when not editing
  useEffect(() => {
    if (!isEditing) setValue(title);
  }, [title, isEditing]);

  // focus and select the input when editing starts
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const save = () => {
    setIsEditing(false);
    const newTitle = value.trim();
    if (newTitle !== title && onChange) onChange(newTitle);
  };

  const cancel = () => {
    setIsEditing(false);
    setValue(title);
  };

  return isEditing ? (
    <div className="flex items-center gap-2">
      <Input
        ref={inputRef}
        className="text-sm font-medium border rounded px-1 py-0.5"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        onBlur={() => save()}
        aria-label="Edit title"
      />

      <Button
        variant="outline"
        type="button"
        onClick={save}
        aria-label="Save title"
        className="p-1 aspect-square"
      >
        {/* simple check icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </Button>
    </div>
  ) : (
    <h1
      className="text-sm font-medium"
      onDoubleClick={() => setIsEditing(true)}
      title="Double-click to edit"
    >
      {title}
    </h1>
  );
};
