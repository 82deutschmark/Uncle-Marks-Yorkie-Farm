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
