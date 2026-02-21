"use client";

import { useState } from "react";
import { GripVertical, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SortableListProps {
  items: string[];
  onItemsChange: (items: string[]) => void;
  placeholder?: string;
  label: string;
}

export function SortableList({
  items,
  onItemsChange,
  placeholder = "Add an item...",
  label,
}: SortableListProps) {
  const [newItem, setNewItem] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function addItem() {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    onItemsChange([...items, trimmed]);
    setNewItem("");
  }

  function removeItem(index: number) {
    onItemsChange(items.filter((_, i) => i !== index));
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const updated = [...items];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    onItemsChange(updated);
    setDragIndex(index);
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      {items.length > 0 && (
        <ul className="mb-2 space-y-1">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm",
                dragIndex === index && "opacity-50",
              )}
            >
              <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
              <span className="flex-1">{item}</span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={addItem}>
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
