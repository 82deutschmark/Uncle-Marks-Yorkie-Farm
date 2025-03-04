import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StoryDisplayProps {
  title: string;
  content: string;
  metadata: {
    wordCount: number;
    chapters: number;
    tone: string;
  };
}

export function StoryDisplay({ title, content, metadata }: StoryDisplayProps) {
  const formattedContent = content.split('\n').map((line, i) => (
    <p key={i} className="mb-4">{line}</p>
  ));

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">{title}</CardTitle>
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <span>{metadata.wordCount} words</span>
          <span>•</span>
          <span>{metadata.chapters} chapters</span>
          <span>•</span>
          <span>{metadata.tone}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[70vh] w-full rounded-md border p-6">
          <div className="prose prose-lg max-w-none">
            {formattedContent}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

interface StoryMetadata {
  protagonist: {
    name: string;
    personality?: string;
    appearance?: string;
  };
  antagonist?: {
    type: string;
    personality?: string;
  };
  theme?: string;
  mood?: string;
  artStyle?: {
    style: string;
    description?: string;
  };
  wordCount?: number;
  chapters?: number;
}

interface StoryDisplayProps {
  title: string;
  content: string;
  metadata: StoryMetadata;
}

export function StoryDisplay({ title, content, metadata }: StoryDisplayProps) {
  const [showMetadata, setShowMetadata] = useState(false);
  
  // Split content into paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim() !== '');
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-serif">{title}</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowMetadata(!showMetadata)}
              className="flex items-center gap-1"
            >
              Story Details
              {showMetadata ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          
          {showMetadata && (
            <div className="mt-4 p-4 bg-muted rounded-md text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Protagonist</h3>
                  <p>{metadata.protagonist.name || 'Unnamed Yorkie'}</p>
                  {metadata.protagonist.personality && <p className="text-muted-foreground">{metadata.protagonist.personality}</p>}
                </div>
                
                {metadata.antagonist && (
                  <div>
                    <h3 className="font-medium">Antagonist</h3>
                    <p>{metadata.antagonist.type.replace('-', ' ')}</p>
                    {metadata.antagonist.personality && <p className="text-muted-foreground">{metadata.antagonist.personality}</p>}
                  </div>
                )}
                
                <div className="col-span-1 md:col-span-2">
                  <h3 className="font-medium">Story Elements</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {metadata.theme && <Badge variant="outline">{metadata.theme}</Badge>}
                    {metadata.mood && <Badge variant="outline">{metadata.mood}</Badge>}
                    {metadata.artStyle?.style && <Badge variant="outline">{metadata.artStyle.style}</Badge>}
                    {metadata.wordCount && <Badge variant="outline">{metadata.wordCount} words</Badge>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        
        <Separator />
        
        <CardContent className="pt-6">
          <div className="prose prose-lg max-w-none">
            {paragraphs.map((paragraph, i) => (
              <p key={i} className="mb-4">{paragraph}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
