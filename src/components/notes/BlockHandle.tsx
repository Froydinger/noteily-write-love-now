import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heading1, Quote, Pilcrow, GripVertical } from "lucide-react";

export type BlockType = "p" | "h1" | "blockquote";

interface BlockHandleProps {
  top: number;
  visible: boolean;
  currentType: BlockType;
  onSelect: (type: BlockType) => void;
}

export const BlockHandle: React.FC<BlockHandleProps> = ({ top, visible, currentType, onSelect }) => {
  if (!visible) return null;

  return (
    <div
      className="absolute z-50"
      style={{ 
        top: Math.max(top, 0), 
        right: -80,
        transform: 'translateY(-50%)'
      }}
      aria-hidden={!visible}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant="secondary" className="rounded-full shadow-sm" aria-label="Change block type">
            <GripVertical className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="flex flex-col gap-1">
            <Button
              variant={currentType === "h1" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => onSelect("h1")}
            >
              <Heading1 className="h-4 w-4 mr-2" /> Header
            </Button>
            <Button
              variant={currentType === "p" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => onSelect("p")}
            >
              <Pilcrow className="h-4 w-4 mr-2" /> Paragraph
            </Button>
            <Button
              variant={currentType === "blockquote" ? "default" : "ghost"}
              className="justify-start"
              onClick={() => onSelect("blockquote")}
            >
              <Quote className="h-4 w-4 mr-2" /> Quote
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
