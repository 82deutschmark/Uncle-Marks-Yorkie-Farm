import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  tags: Array<{
    label: string;
    emoji?: string;
  }>;
  onSelect: (tag: string) => void;
  className?: string;
}

export function TagSelector({ tags, onSelect, className }: TagSelectorProps) {
  return (
    <div className={cn("flex flex-wrap gap-2 mt-2", className)}>
      {tags.map((tag) => (
        <Button
          key={tag.label}
          variant="outline"
          size="sm"
          className="text-sm"
          onClick={() => onSelect(tag.label)}
        >
          {tag.emoji && <span className="mr-1">{tag.emoji}</span>}
          {tag.label}
        </Button>
      ))}
    </div>
  );
}
