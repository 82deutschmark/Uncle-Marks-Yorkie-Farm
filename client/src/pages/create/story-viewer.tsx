
import { useQuery } from "@tanstack/react-query";
import { StoryDisplay } from "@/components/story-display";
import { type Story } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Share } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useApiRequest } from "@/hooks/use-api-request";
import { useLocation } from "wouter";

export default function StoryViewer({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const apiRequest = useApiRequest();

  const { data: story, isLoading } = useQuery<Story>({
    queryKey: [`/api/stories/${params.id}`]
  });

  const handleGenerateImage = async () => {
    if (!story) return;
    
    try {
      setIsGeneratingImage(true);
      toast({
        title: "Generating Image",
        description: "Creating a beautiful illustration for your story...",
      });
      
      const response = await apiRequest("/api/images/generate-dalle", {
        method: "POST",
        body: JSON.stringify({
          prompt: `A Yorkie dog named ${story.metadata.protagonist.name || 'Yorkie Hero'} in a whimsical scene from the story: ${story.title}. Art style: ${story.metadata.artStyle?.style || 'colorful cartoon'}`,
          style: story.metadata.artStyle?.style || 'colorful'
        })
      });
      
      if (response.imageUrl) {
        setGeneratedImageUrl(response.imageUrl);
        toast({
          title: "Image Generated",
          description: "Your story illustration is ready!",
        });
      } else {
        throw new Error("Failed to generate image");
      }
    } catch (error) {
      console.error("Image generation error:", error);
      toast({
        title: "Image Generation Failed",
        description: "We couldn't generate an image for your story at this time. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="w-full max-w-4xl h-[80vh] mx-auto" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-serif mb-4">Story Not Found</h1>
        <Button onClick={() => setLocation("/")}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="mb-4 sm:mb-0"
          >
            &larr; Back to Home
          </Button>
          <div className="space-x-2">
            <Button 
              onClick={handleGenerateImage} 
              disabled={isGeneratingImage}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isGeneratingImage ? "Generating..." : "Generate Illustration"}
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Save as PDF
            </Button>
            <Button variant="outline" className="gap-2">
              <Share className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
        
        {generatedImageUrl && (
          <div className="mb-6">
            <div className="bg-muted rounded-lg p-4 flex justify-center">
              <img 
                src={generatedImageUrl} 
                alt="Story Illustration" 
                className="max-h-96 rounded shadow-md" 
              />
            </div>
          </div>
        )}
        
        <StoryDisplay
          title={story.title}
          content={story.content}
          metadata={story.metadata}
        />
      </div>
    </div>
  );
}
