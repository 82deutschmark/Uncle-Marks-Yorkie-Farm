import { useQuery } from "@tanstack/react-query";
import { StoryDisplay } from "@/components/story-display";
import { type Story } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface StoryMetadata {
  wordCount: number;
  chapters: number;
  tone: string;
}

export default function StoryViewer({ params }: { params: { id: string } }) {
  const { data: story, isLoading } = useQuery<Story>({
    queryKey: [`/api/stories/${params.id}`]
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="w-full max-w-4xl h-[80vh] mx-auto" />
      </div>
    );
  }

  if (!story) {
    return <div>Story not found</div>;
  }

  const metadata = story.metadata as StoryMetadata;

  return (
    <div className="min-h-screen bg-background p-4">
      <StoryDisplay
        title={story.title}
        content={story.content}
        metadata={metadata}
      />
    </div>
  );
}