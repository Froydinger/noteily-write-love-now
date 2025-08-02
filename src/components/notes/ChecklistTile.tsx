import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface ChecklistData {
  id: string;
  items: ChecklistItem[];
}

interface ChecklistTileProps {
  data: ChecklistData;
  onChange: (data: ChecklistData) => void;
  onDelete: () => void;
  isReadOnly?: boolean;
}

export function ChecklistTile({ data, onChange, onDelete, isReadOnly = false }: ChecklistTileProps) {
  const [items, setItems] = useState<ChecklistItem[]>(data.items);

  useEffect(() => {
    setItems(data.items);
  }, [data.items]);

  const updateData = (newItems: ChecklistItem[]) => {
    setItems(newItems);
    onChange({ ...data, items: newItems });
  };

  const addItem = () => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      text: '',
      checked: false
    };
    updateData([...items, newItem]);
  };

  const updateItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    const newItems = items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    updateData(newItems);
  };

  const removeItem = (itemId: string) => {
    if (items.length === 1) {
      onDelete();
    } else {
      const newItems = items.filter(item => item.id !== itemId);
      updateData(newItems);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, itemId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentItem = items.find(item => item.id === itemId);
      if (currentItem?.text.trim()) {
        addItem();
        // Focus the new item after it's added
        setTimeout(() => {
          const inputs = document.querySelectorAll('.checklist-input');
          const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
          lastInput?.focus();
        }, 50);
      }
    } else if (e.key === 'Backspace') {
      const currentItem = items.find(item => item.id === itemId);
      if (!currentItem?.text && e.currentTarget.selectionStart === 0) {
        e.preventDefault();
        removeItem(itemId);
      }
    }
  };

  const completedCount = items.filter(item => item.checked).length;

  return (
    <div className="checklist-tile border border-border/50 rounded-lg p-4 my-4 bg-card/30 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Checklist
          </h3>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{items.length}
          </span>
        </div>
        {!isReadOnly && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <button
              onClick={() => !isReadOnly && updateItem(item.id, { checked: !item.checked })}
              disabled={isReadOnly}
              className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center 
                transition-all duration-200 flex-shrink-0
                ${item.checked 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : 'border-border hover:border-primary/50'
                }
                ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {item.checked && (
                <svg
                  className="w-2.5 h-2.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
            <input
              type="text"
              value={item.text}
              onChange={(e) => !isReadOnly && updateItem(item.id, { text: e.target.value })}
              onKeyDown={(e) => !isReadOnly && handleKeyDown(e, item.id)}
              placeholder="List item"
              readOnly={isReadOnly}
              className={`
                flex-1 bg-transparent border-none outline-none text-sm
                placeholder-muted-foreground
                ${item.checked 
                  ? 'line-through text-muted-foreground' 
                  : 'text-foreground'
                }
                ${isReadOnly ? 'cursor-not-allowed' : ''}
                checklist-input
              `}
            />
          </div>
        ))}
      </div>

      {!isReadOnly && (
        <Button
          variant="ghost"
          size="sm"
          onClick={addItem}
          className="mt-3 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add item
        </Button>
      )}
    </div>
  );
}