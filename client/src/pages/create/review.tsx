import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Wand2, Loader2, Code2, BookOpen, Frame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { StoryParams } from "@shared/schema";

interface StoryDetails {
  colors: string[];
  personality: string;
  theme: string;
  antagonist: string;
  farmElements: string[];
  artStyles: string[];
}

interface GenerationState {
  characters: {
    completed: boolean;
    loading: boolean;
    error?: string;
    imageIds?: number[];
  };
  story: {
    completed: boolean;
    loading: boolean;
    error?: string;
    data?: any;
  };
}

export default function ReviewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [developerMode, setDeveloperMode] = useState(false);
  const [generationState, setGenerationState] = useState<GenerationState>({
    characters: {
      completed: false,
      loading: false
    },
    story: {
      completed: false,
      loading: false
    }
  });

  const [storyDetails, setStoryDetails] = useState<StoryDetails>({
    colors: [],
    personality: '',
    theme: '',
    antagonist: '',
    farmElements: [],
    artStyles: []
  });

  // Load all selections from localStorage
  useEffect(() => {
    try {
      const details: StoryDetails = {
        colors: JSON.parse(localStorage.getItem("yorkieColors") || "[]"),
        personality: localStorage.getItem("yorkiePersonality") || "",
        theme: localStorage.getItem("yorkieTheme") || "",
        antagonist: localStorage.getItem("yorkieAntagonist") || "",
        farmElements: JSON.parse(localStorage.getItem("yorkieElements") || "[]"),
        artStyles: JSON.parse(localStorage.getItem("yorkieArtStyles") || "[]")
      };
      setStoryDetails(details);
    } catch (error) {
      console.error('Error loading story details:', error);
      toast({
        title: "Error",
        description: "Failed to load story details. Please try again.",
        variant: "destructive"
      });
    }
  }, []);

  async function handleGenerateCharacters() {
    setGenerationState(prev => ({
      ...prev,
      characters: { ...prev.characters, loading: true, error: undefined }
    }));

    try {
      // Prepare character generation parameters
      const params = {
        protagonist: {
          personality: storyDetails.personality,
          appearance: `A beautiful Yorkshire Terrier with ${storyDetails.colors.join(" and ").toLowerCase()} colors`
        },
        artStyle: {
          style: storyDetails.artStyles[0] as "whimsical" | "studio-ghibli" | "watercolor" | "pixel-art" | "pop-art" | "pencil-sketch" | "3d-cartoon" | "storybook",
          description: `A magical blend of ${storyDetails.artStyles.join(", ")}`
        },
        description: `Create an illustration of a Yorkshire Terrier character. The Yorkie has ${storyDetails.colors.join(" and ").toLowerCase()} colors and embodies ${storyDetails.personality.toLowerCase()} personality traits.`
      };

      console.log('Sending generation request with params:', params);

      // Send request to generate character illustrations
      const response = await apiRequest("/api/images/generate", {
        method: "POST",
        body: JSON.stringify(params)
      });

      if (!response) {
        throw new Error('No response received from server');
      }

      if (response.error) {
        throw new Error(response.error);
      }

      setGenerationState(prev => ({
        ...prev,
        characters: { 
          loading: false, 
          completed: true,
          imageIds: response.imageIds 
        }
      }));

      toast({
        title: "Success",
        description: "Character illustrations are being generated!",
      });
    } catch (error) {
      console.error('Character generation error:', error);
      setGenerationState(prev => ({
        ...prev,
        characters: {
          loading: false,
          completed: false,
          error: error instanceof Error ? error.message : 'Failed to generate characters'
        }
      }));

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate character illustrations. Please try again.",
        variant: "destructive"
      });
    }
  }

  const handleGenerateStory = async () => {
    setGenerationState(prev => ({
      ...prev,
      story: { ...prev.story, loading: true, error: undefined }
    }));

    try {
      const storyParams: StoryParams = {
        protagonist: {
          personality: storyDetails.personality,
          appearance: `A beautiful Yorkshire Terrier with ${storyDetails.colors.join(" and ").toLowerCase()} colors`
        },
        theme: storyDetails.theme,
        mood: "Lighthearted",
        artStyle: {
          style: storyDetails.artStyles[0],
          description: `A magical blend of ${storyDetails.artStyles.join(", ")}`
        },
        antagonist: {
          type: storyDetails.antagonist as any, // Type will be validated by schema
          personality: "playful yet challenging"
        },
        farmElements: storyDetails.farmElements
      };

      // Send request to generate story
      const response = await apiRequest("/api/stories/generate", {
        method: "POST",
        body: JSON.stringify(storyParams)
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setGenerationState(prev => ({
        ...prev,
        story: {
          loading: false,
          completed: true,
          data: response
        }
      }));

      toast({
        title: "Success",
        description: "Story generated successfully!",
      });
    } catch (error) {
      console.error('Story generation error:', error);
      setGenerationState(prev => ({
        ...prev,
        story: {
          loading: false,
          completed: false,
          error: error instanceof Error ? error.message : 'Failed to generate story'
        }
      }));

      toast({
        title: "Error",
        description: "Failed to generate story. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewStorybook = () => {
    const storyData = generationState.story.data;
    if (storyData?.id) {
      setLocation(`/story/${storyData.id}`);
    } else {
      toast({
        title: "Error",
        description: "Story data is not available. Please try generating the story again.",
        variant: "destructive"
      });
    }
  };

  // Developer mode preview functions
  const getOpenAIPreview = () => ({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are a master storyteller specializing in children's literature. Create an engaging, age-appropriate story that captures the magic and charm of Yorkshire Terriers while weaving in important life lessons."
      },
      {
        role: "user",
        content: `Create a children's story with these elements:
- Main Character: A ${storyDetails.personality.toLowerCase()} Yorkshire Terrier with ${storyDetails.colors.join(" and ")} colors
- Setting: Uncle Mark's Farm, featuring ${storyDetails.farmElements.join(", ")}
- Theme: ${storyDetails.theme}
- Antagonist: ${storyDetails.antagonist}
- Tone: Magical and lighthearted, suitable for young readers`
      }
    ],
    temperature: 0.7,
    max_tokens: 2000
  });

  const getMidJourneyPreview = () => ({
    prompt: `/imagine Yorkshire Terrier, ${storyDetails.colors.join(" and ")}, ${storyDetails.personality.toLowerCase()}, magical farm setting, ${storyDetails.artStyles.join(", ")}, whimsical children's book illustration style --ar 1:1 --v 5.2`,
    artStyle: storyDetails.artStyles[0],
    description: `A magical blend of ${storyDetails.artStyles.join(", ")}`
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress indicator */}
        <div className="w-full">
          <Progress value={100} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">Final Step: Review & Generate</p>
        </div>

        {/* Header with developer mode toggle */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Review Your Story</h1>
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            <span className="text-sm">Developer Mode</span>
            <Switch
              checked={developerMode}
              onCheckedChange={setDeveloperMode}
            />
          </div>
        </div>

        {/* Main content card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Story Details</CardTitle>
            <CardDescription>
              Review your choices and generate your magical Yorkie tale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Story Details Display */}
                <div>
                  <h3 className="font-semibold mb-2">Appearance</h3>
                  <div className="bg-muted/20 rounded-lg p-4">
                    <div className="flex gap-2 flex-wrap">
                      {storyDetails.colors.map((color) => (
                        <span
                          key={color}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Personality</h3>
                  <div className="bg-muted/20 rounded-lg p-4">
                    <p>{storyDetails.personality}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Story Elements</h3>
                  <div className="bg-muted/20 rounded-lg p-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">Theme</h4>
                      <p>{storyDetails.theme}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Antagonist</h4>
                      <p>{storyDetails.antagonist}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Farm Elements</h4>
                      <div className="flex gap-2 flex-wrap">
                        {storyDetails.farmElements.map((element) => (
                          <span
                            key={element}
                            className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                          >
                            {element}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Art Styles</h3>
                  <div className="bg-muted/20 rounded-lg p-4">
                    <div className="flex gap-2 flex-wrap">
                      {storyDetails.artStyles.map((style) => (
                        <span
                          key={style}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Developer Mode Preview */}
                {developerMode && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        API Commands Preview
                        <Badge variant="outline">Developer</Badge>
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">OpenAI Command</h4>
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                            <code>{JSON.stringify(getOpenAIPreview(), null, 2)}</code>
                          </pre>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">MidJourney Command</h4>
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                            <code>{JSON.stringify(getMidJourneyPreview(), null, 2)}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 mt-6 pt-6 border-t">
              {/* Character Generation Button */}
              <Button
                onClick={handleGenerateCharacters}
                disabled={generationState.characters.loading || generationState.characters.completed}
                className="w-full"
                variant={generationState.characters.completed ? "outline" : "default"}
              >
                {generationState.characters.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Characters...
                  </>
                ) : generationState.characters.completed ? (
                  <>
                    <Frame className="mr-2 h-4 w-4" />
                    Characters Generated!
                  </>
                ) : (
                  <>
                    <Frame className="mr-2 h-4 w-4" />
                    Generate Characters
                  </>
                )}
              </Button>

              {/* Story Generation Button */}
              <Button
                onClick={handleGenerateStory}
                disabled={
                  !generationState.characters.completed ||
                  generationState.story.loading ||
                  generationState.story.completed
                }
                className="w-full"
                variant={generationState.story.completed ? "outline" : "default"}
              >
                {generationState.story.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Story...
                  </>
                ) : generationState.story.completed ? (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Story Generated!
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Story
                  </>
                )}
              </Button>

              {/* View Storybook Button */}
              <Button
                onClick={handleViewStorybook}
                disabled={!generationState.characters.completed || !generationState.story.completed}
                className="w-full"
                variant="default"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                View Storybook
              </Button>

              {/* Back Button */}
              <Button
                onClick={() => setLocation("/create/art-style")}
                variant="outline"
                className="w-full"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}