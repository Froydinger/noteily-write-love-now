import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heading1, Quote, Pilcrow, Type } from "lucide-react";

export type BlockType = "p" | "h1";

interface BlockHandleProps {
  top: number;
  visible: boolean;
  currentType: BlockType;
  onSelect: (type: BlockType) => void;
}

export const BlockHandle: React.FC<BlockHandleProps> = ({ top, visible, currentType, onSelect }) => {
  return (
    <div
      className={`fixed z-50 transition-all duration-300 ease-out ${
        visible 
          ? 'opacity-80' 
          : 'opacity-0 pointer-events-none'
      }`}
      style={{ 
        top: `${top}px`,
        right: '1rem'
      }}
      aria-hidden={!visible}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full shadow-md border border-border/50 bg-background/90 backdrop-blur-sm hover:bg-muted/90 dark:border-border" 
            aria-label="Change block type"
            onPointerDown={(e) => e.preventDefault()}
          >
            <Type className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2" align="center">
          <div className="flex flex-col gap-1">
            <Button
              variant={currentType === "h1" ? "default" : "ghost"}
              className="justify-start"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => onSelect("h1")}
            >
              <Heading1 className="h-4 w-4 mr-2" /> Header
            </Button>
            <Button
              variant={currentType === "p" ? "default" : "ghost"}
              className="justify-start"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => onSelect("p")}
            >
              <Pilcrow className="h-4 w-4 mr-2" /> Body
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
