import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2, ChevronRight, ImagePlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

enum GenerationStage {
  GENERATING_STORY,
  CHARACTER_APPROVAL,
  DRAWING_CHARACTER,
  CHAPTER_DISPLAY
}

interface StoryResponse {
  id: number;
  title: string;
  content: string;
  metadata: {
    protagonist: {
      name: string;
      personality: string;
    };
  };
}

export default function StoryGenerationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStage, setCurrentStage] = useState<GenerationStage>(GenerationStage.GENERATING_STORY);
  const [storyData, setStoryData] = useState<StoryResponse | null>(null);

  // Get story generation parameters from localStorage
  const storyParams = JSON.parse(localStorage.getItem("storyParams") || "{}");

  // Query to generate the story
  const { data: story, isLoading, error } = useQuery({
    queryKey: ['/api/stories/generate', Date.now()], // Add timestamp to force fresh request
    queryFn: async () => {
      const response = await apiRequest("/api/stories/generate", {
        method: "POST",
        body: JSON.stringify(storyParams)
      });
      return response as StoryResponse;
    },
    enabled: Boolean(storyParams), // Only run if we have parameters
    staleTime: 0, // Consider data immediately stale
    cacheTime: 0, // Don't cache the response
    onSuccess: (data) => {
      setStoryData(data);
      setCurrentStage(GenerationStage.CHARACTER_APPROVAL);
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate story. Please try again.",
        variant: "destructive"
      });
      setLocation("/");
    }
  });

  // Mutation to trigger character drawing
  const drawCharacterMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/midjourney/generate", {
        method: "POST",
        body: JSON.stringify({
          characterDescription: storyData?.metadata.protagonist,
          artStyle: storyParams.artStyle
        })
      });
    },
    onSuccess: () => {
      setCurrentStage(GenerationStage.DRAWING_CHARACTER);
      // We'll implement the transition to chapter display in the next step
      setTimeout(() => {
        setCurrentStage(GenerationStage.CHAPTER_DISPLAY);
      }, 2000);
    }
  });

  const handleDrawCharacter = () => {
    drawCharacterMutation.mutate();
  };

  const renderContent = () => {
    switch (currentStage) {
      case GenerationStage.GENERATING_STORY:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-6 text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <h2 className="text-2xl font-serif">Creating Your Magical Story</h2>
              <p className="text-muted-foreground">
                Our AI is crafting a unique tale just for you...
              </p>
            </CardContent>
          </Card>
        );

      case GenerationStage.CHARACTER_APPROVAL:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Meet Your Story's Hero</CardTitle>
              <CardDescription>
                Here's the character we've created for your story. Would you like to bring them to life?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold text-xl">{storyData?.metadata.protagonist.name}</h3>
                <p className="text-muted-foreground">{storyData?.metadata.protagonist.personality}</p>
              </div>
              <Button 
                onClick={handleDrawCharacter} 
                disabled={drawCharacterMutation.isPending}
                className="w-full"
              >
                {drawCharacterMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Drawing Character...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Draw Character
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );

      case GenerationStage.DRAWING_CHARACTER:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-6 text-center space-y-4">
              <ImagePlus className="h-12 w-12 animate-pulse mx-auto text-primary" />
              <h2 className="text-2xl font-serif">Drawing Your Character</h2>
              <p className="text-muted-foreground">
                MidJourney is bringing your character to life...
              </p>
            </CardContent>
          </Card>
        );

      case GenerationStage.CHAPTER_DISPLAY:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-6 text-center space-y-4">
              <h2 className="text-2xl font-serif">Your Story Begins</h2>
              <Button 
                onClick={() => setLocation(`/story/${storyData?.id}`)}
                className="mx-auto"
              >
                Start Reading
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {renderContent()}
      </div>
    </div>
  );
}