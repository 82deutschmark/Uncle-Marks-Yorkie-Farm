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
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState<number | null>(null);

  // Get story generation parameters from localStorage
  const storyParams = JSON.parse(localStorage.getItem("storyParams") || "{}");

  // Timer effect for progress indication
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentStage === GenerationStage.GENERATING_STORY) {
      // Start progress timer
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
        setProgress(prev => {
          // Estimated time: 20 seconds
          const newProgress = Math.min((prev + 5), 95);
          return newProgress;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStage]);

  // Handle API rate limiting
  useEffect(() => {
    if (retryTimeout !== null) {
      const timer = setTimeout(() => {
        setRetryTimeout(null);
        setRetryAttempt(prev => prev + 1);
      }, retryTimeout);

      return () => clearTimeout(timer);
    }
  }, [retryTimeout]);

  // Query to generate the story
  const { error } = useQuery({
    queryKey: ['/api/stories/generate', retryAttempt],
    queryFn: async () => {
      const response = await apiRequest("/api/stories/generate", {
        method: "POST",
        body: JSON.stringify(storyParams)
      });
      return response as StoryResponse;
    },
    enabled: Boolean(storyParams) && retryTimeout === null,
    staleTime: 0,
    gcTime: 0,
    onSuccess: (data) => {
      setStoryData(data);
      setProgress(100);
      setCurrentStage(GenerationStage.CHARACTER_APPROVAL);
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
    onError: (error: any) => {
      const isRateLimit = error.message?.includes('rate limit');
      if (isRateLimit && error.retryAfter) {
        setRetryTimeout(error.retryAfter * 1000);
        toast({
          title: "Generation Paused",
          description: `Rate limit reached. Retrying in ${Math.ceil(error.retryAfter)} seconds...`,
          variant: "warning"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate story. Please try again.",
          variant: "destructive"
        });
        setLocation("/");
      }
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
      // Transition to chapter display after character is drawn
      setTimeout(() => {
        setCurrentStage(GenerationStage.CHAPTER_DISPLAY);
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate character illustration. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleDrawCharacter = () => {
    drawCharacterMutation.mutate();
  };

  const getStageMessage = () => {
    if (retryTimeout !== null) {
      return {
        title: "Generation Paused",
        description: `Waiting to retry... (${Math.ceil(retryTimeout / 1000)}s)`,
        subtext: "The AI needs a short break. We'll continue automatically."
      };
    }

    switch (currentStage) {
      case GenerationStage.GENERATING_STORY:
        return {
          title: "Creating Your Magical Story",
          description: `Our AI is crafting a unique tale just for you... (${timeElapsed}s)`,
          subtext: retryAttempt > 0 
            ? `Attempt ${retryAttempt + 1} - This usually takes about 20 seconds`
            : "This usually takes about 20 seconds"
        };
      case GenerationStage.CHARACTER_APPROVAL:
        return {
          title: "Meet Your Story's Hero",
          description: "Here's the character we've created. Ready to bring them to life?",
          subtext: "Click 'Draw Character' when you're ready to see them illustrated"
        };
      case GenerationStage.DRAWING_CHARACTER:
        return {
          title: "Drawing Your Character",
          description: "MidJourney is bringing your character to life...",
          subtext: "This process takes about 30-60 seconds"
        };
      case GenerationStage.CHAPTER_DISPLAY:
        return {
          title: "Your Story Begins",
          description: "Everything is ready! Let's start reading.",
          subtext: "Click 'Start Reading' to begin your adventure"
        };
    }
  };

  const renderContent = () => {
    const message = getStageMessage();

    switch (currentStage) {
      case GenerationStage.GENERATING_STORY:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col items-center gap-4">
                {retryTimeout !== null ? (
                  <AlertCircle className="h-12 w-12 text-warning animate-pulse" />
                ) : (
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                )}
                <h2 className="text-2xl font-serif text-center">{message.title}</h2>
                <p className="text-muted-foreground text-center">{message.description}</p>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">{message.subtext}</p>
              </div>
              {error && !retryTimeout && (
                <div className="mt-4 p-4 bg-destructive/10 rounded-lg flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p>Something went wrong. Please try again.</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case GenerationStage.CHARACTER_APPROVAL:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>{message.title}</CardTitle>
              <CardDescription>{message.description}</CardDescription>
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
              <p className="text-sm text-center text-muted-foreground">{message.subtext}</p>
            </CardContent>
          </Card>
        );

      case GenerationStage.DRAWING_CHARACTER:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <ImagePlus className="h-12 w-12 animate-pulse text-primary" />
                <h2 className="text-2xl font-serif">{message.title}</h2>
                <p className="text-muted-foreground text-center">{message.description}</p>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">{message.subtext}</p>
              </div>
            </CardContent>
          </Card>
        );

      case GenerationStage.CHAPTER_DISPLAY:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-6 text-center space-y-6">
              <h2 className="text-2xl font-serif">{message.title}</h2>
              <p className="text-muted-foreground">{message.description}</p>
              <Button 
                onClick={() => setLocation(`/story/${storyData?.id}`)}
                className="mx-auto"
              >
                Start Reading
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-sm text-muted-foreground">{message.subtext}</p>
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