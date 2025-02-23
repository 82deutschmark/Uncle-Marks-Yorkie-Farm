import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Wand2, ChevronRight, ImagePlus, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ImageGallery } from "@/components/image-gallery";

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
    image_urls?: string[];
  };
}

export default function StoryGenerationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStage, setCurrentStage] = useState<GenerationStage>(GenerationStage.GENERATING_STORY);
  const [storyData, setStoryData] = useState<StoryResponse | null>(null);
  const [progress, setProgress] = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Get story generation parameters from localStorage
  const storyParams = localStorage.getItem("storyParams");
  const parsedParams = storyParams ? JSON.parse(storyParams) : null;

  // Story generation query
  const { error, isError, isLoading } = useQuery({
    queryKey: ['/api/stories/generate', retryAttempt],
    queryFn: async () => {
      try {
        if (!parsedParams) {
          throw new Error("No story parameters found");
        }

        console.log('Starting story generation with params:', parsedParams);
        const response = await apiRequest("/api/stories/generate", {
          method: "POST",
          body: JSON.stringify(parsedParams)
        });

        if (!response || response.error) {
          throw new Error(response?.error || 'Failed to generate story');
        }

        console.log('Story generation successful:', response);
        setStoryData(response);
        setProgress(100);
        setCurrentStage(GenerationStage.CHARACTER_APPROVAL);
        return response;

      } catch (error: any) {
        console.error('Story generation error:', error);
        const errorMessage = error.message || 'Unknown error occurred';

        toast({
          title: "Generation Error",
          description: errorMessage,
          variant: "destructive"
        });

        throw error;
      }
    },
    enabled: Boolean(parsedParams),
    retry: false
  });

  // Progress indication
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentStage === GenerationStage.GENERATING_STORY && isLoading) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 2, 95);
          return newProgress;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStage, isLoading]);

  // Character illustration mutation
  const drawCharacterMutation = useMutation({
    mutationFn: async () => {
      if (!storyData?.metadata.protagonist) {
        throw new Error("No character data available");
      }

      const response = await apiRequest("/api/midjourney/generate", {
        method: "POST",
        body: JSON.stringify({
          characterDescription: storyData.metadata.protagonist,
          artStyle: parsedParams?.artStyle
        })
      });

      return response;
    },
    onSuccess: () => {
      setCurrentStage(GenerationStage.DRAWING_CHARACTER);
      setTimeout(() => setCurrentStage(GenerationStage.CHAPTER_DISPLAY), 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Illustration Error",
        description: error.message || "Failed to generate character illustration",
        variant: "destructive"
      });
    }
  });

  // Content rendering based on stage
  const renderContent = () => {
    if (isError) {
      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h2 className="text-2xl font-serif text-center">Generation Error</h2>
              <p className="text-muted-foreground text-center">
                {error instanceof Error ? error.message : 'Failed to generate story'}
              </p>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/details")}
                >
                  Back to Story Details
                </Button>
                <Button
                  onClick={() => setRetryAttempt(prev => prev + 1)}
                >
                  Retry Generation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    switch (currentStage) {
      case GenerationStage.GENERATING_STORY:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <h2 className="text-2xl font-serif">Creating Your Story</h2>
                <p className="text-muted-foreground text-center">
                  Our AI is crafting your magical tale...
                </p>
                <Progress value={progress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        );

      case GenerationStage.CHARACTER_APPROVAL:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Meet Your Story's Hero</CardTitle>
              <CardDescription>Ready to bring your character to life?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold text-xl">{storyData?.metadata.protagonist.name}</h3>
                <p className="text-muted-foreground">{storyData?.metadata.protagonist.personality}</p>
              </div>
              <Button
                onClick={() => drawCharacterMutation.mutate()}
                disabled={drawCharacterMutation.isPending}
                className="w-full"
              >
                {drawCharacterMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Illustration...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Create Illustration
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );

      case GenerationStage.DRAWING_CHARACTER:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <ImagePlus className="h-12 w-12 animate-pulse text-primary" />
                <h2 className="text-2xl font-serif">Creating Illustration</h2>
                <p className="text-muted-foreground text-center">
                  Bringing your character to life...
                </p>
                <Progress value={progress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        );

      case GenerationStage.CHAPTER_DISPLAY:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-serif">Your Story is Ready!</h2>
              <div className="my-6">
                {storyData?.metadata.image_urls && (
                  <div className="grid grid-cols-2 gap-4">
                    {storyData.metadata.image_urls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Story illustration ${index + 1}`}
                        className="rounded-lg shadow-lg"
                      />
                    ))}
                  </div>
                )}
              </div>
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