import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Wand2, ChevronRight, ImagePlus, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { storyParamsSchema, type StoryParams, type StoryResponse } from "@shared/schema";

enum GenerationStage {
  GENERATING_STORY,
  CHARACTER_APPROVAL,
  DRAWING_CHARACTER,
  CHAPTER_DISPLAY
}

export default function StoryGenerationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStage, setCurrentStage] = useState<GenerationStage>(GenerationStage.GENERATING_STORY);
  const [storyData, setStoryData] = useState<StoryResponse | null>(null);
  const [progress, setProgress] = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Get story generation parameters from localStorage
  const storedParams = localStorage.getItem("storyParams");

  // Story generation query
  const { error, isError, isLoading } = useQuery({
    queryKey: ['/api/stories/generate', retryAttempt],
    queryFn: async () => {
      try {
        if (!storedParams) {
          throw new Error("Story parameters not found. Please return to the details page.");
        }

        // Parse and validate parameters
        let parsedParams: StoryParams;
        try {
          const params = JSON.parse(storedParams);
          
          // Set default protagonist name if missing
          if (params.protagonist && !params.protagonist.name) {
            params.protagonist.name = "";
          }
          
          // Set default antagonist if missing
          if (!params.antagonist) {
            params.antagonist = {
              type: "squirrel-gang", // Use a valid enum value
              personality: "Mischievous and sneaky"
            };
          } else if (params.antagonist.type === "squirrel") {
            // Fix invalid antagonist type
            params.antagonist.type = "squirrel-gang";
          }
          
          // Ensure artStyle has description field
          if (params.artStyle && !params.artStyle.description) {
            params.artStyle.description = params.artStyle.details || "Colorful and expressive";
          }
          
          // Add required farmElements if missing
          if (!params.farmElements) {
            params.farmElements = ["barn", "tractor", "fields"];
          }
          
          parsedParams = storyParamsSchema.parse(params);
          console.log('Valid story parameters:', parsedParams);
        } catch (e) {
          console.error('Parameter validation error:', e);
          throw new Error("Invalid story parameters. Please complete all details.");
        }

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
    enabled: Boolean(storedParams),
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

      // Parse stored params again for art style
      const params = storedParams ? JSON.parse(storedParams) : null;
      if (!params?.artStyle) {
        throw new Error("Art style configuration not found");
      }

      const response = await apiRequest("/api/images/generate", {
        method: "POST",
        body: JSON.stringify({
          protagonist: {
            personality: storyData.metadata.protagonist.personality,
            appearance: params.protagonist.appearance
          },
          artStyle: params.artStyle,
          description: `A Yorkshire Terrier named ${storyData.metadata.protagonist.name} who is ${storyData.metadata.protagonist.personality}`
        })
      });

      if (!response || response.error) {
        throw new Error(response?.error || 'Failed to generate image');
      }

      // Store the generated image URL
      console.log('Image generation response:', response);
      if (response.imageUrl) {
        setGeneratedImageUrl(response.imageUrl);
      }

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
                {generatedImageUrl && (
                  <div className="flex justify-center">
                    <img
                      src={generatedImageUrl}
                      alt={`Illustration of ${storyData?.metadata.protagonist.name || 'Yorkie Hero'}`}
                      className="rounded-lg shadow-lg max-w-full h-auto max-h-72"
                    />
                  </div>
                )}
                <div className="mt-4 mb-6 text-left max-h-[200px] overflow-y-auto p-4 bg-muted rounded-md">
                  <p className="text-sm italic">
                    {storyData?.content.slice(0, 300)}...
                  </p>
                </div>
              </div>
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={() => setLocation(`/story/${storyData?.id}`)}
                  className="mx-auto"
                >
                  Start Reading
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
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