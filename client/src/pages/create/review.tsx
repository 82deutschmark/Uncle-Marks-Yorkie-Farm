import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Code2 } from "lucide-react";
import type { StoryDetails } from "@shared/schema";

interface GenerationState {
  characters: {
    completed: boolean;
    loading: boolean;
    error?: string;
    imageUrls?: string[];
    selectedPrompt?: string;
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
  const [midjourneyPrompt, setMidjourneyPrompt] = useState<string>("");
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

  useEffect(() => {
    // Load saved details from localStorage
    try {
      const savedDetails: StoryDetails = {
        colors: JSON.parse(localStorage.getItem("yorkieColors") || "[]"),
        personality: localStorage.getItem("yorkiePersonality") || "",
        theme: localStorage.getItem("yorkieTheme") || "",
        antagonist: localStorage.getItem("yorkieAntagonist") || "",
        farmElements: JSON.parse(localStorage.getItem("yorkieFarmElements") || "[]"),
        artStyles: JSON.parse(localStorage.getItem("yorkieArtStyles") || "[]")
      };
      setStoryDetails(savedDetails);
    } catch (error) {
      console.error('Error loading story details:', error);
      toast({
        title: "Error",
        description: "Failed to load story details. Please try again.",
        variant: "destructive"
      });
    }
  }, []);

  const handleYorkieSearch = async () => {
    setGenerationState(prev => ({
      ...prev,
      characters: { ...prev.characters, loading: true }
    }));

    try {
      const description = `A Yorkshire Terrier with ${storyDetails.colors.join(", ")} colors, ${storyDetails.personality} personality in ${storyDetails.artStyles.join(", ")} style`;
      const response = await fetch("/api/images/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description })
      });

      const data = await response.json();
      setGenerationState(prev => ({
        ...prev,
        characters: {
          completed: true,
          loading: false,
          imageUrls: data.images,
          selectedPrompt: data.prompt
        }
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search for Yorkie images",
        variant: "destructive"
      });
      setGenerationState(prev => ({
        ...prev,
        characters: { ...prev.characters, loading: false, error: "Failed to search images" }
      }));
    }
  };

  const generateMidjourneyPrompt = () => {
    const prompt = `A heartwarming ${storyDetails.artStyles.join(", ")} style illustration of a Yorkshire Terrier with ${storyDetails.colors.join(", ")} fur, displaying a ${storyDetails.personality} personality. Set in Uncle Mark's Farm, featuring ${storyDetails.farmElements.join(", ")}. The story involves ${storyDetails.antagonist} as a playful antagonist. ${storyDetails.theme} theme. --ar 16:9 --style raw`;
    setMidjourneyPrompt(prompt);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="w-full">
          <Progress value={100} />
          <p className="text-sm text-muted-foreground mt-1">Story Control Center</p>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">Story Details</h1>
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            <span className="text-sm">Dev Mode</span>
            <Switch checked={developerMode} onCheckedChange={setDeveloperMode} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="col-span-1">
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Story Elements</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Colors:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {storyDetails.colors.map(color => (
                        <Badge key={color} variant="outline">{color}</Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium">Personality:</span>
                    <p className="text-sm">{storyDetails.personality}</p>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium">Theme:</span>
                    <p className="text-sm">{storyDetails.theme}</p>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium">Farm Elements:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {storyDetails.farmElements.map(element => (
                        <Badge key={element} variant="outline">{element}</Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium">Art Styles:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {storyDetails.artStyles.map(style => (
                        <Badge key={style} variant="outline">{style}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Character Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={handleYorkieSearch}
                  disabled={generationState.characters.loading}
                >
                  Search for Yorkie Friends
                </Button>

                {generationState.characters.imageUrls && (
                  <div className="grid grid-cols-3 gap-2">
                    {generationState.characters.imageUrls.map((url, idx) => (
                      <img 
                        key={idx} 
                        src={url} 
                        alt={`Yorkie preview ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    ))}
                  </div>
                )}

                <Button 
                  className="w-full"
                  onClick={generateMidjourneyPrompt}
                  variant="outline"
                >
                  Generate Midjourney Prompt
                </Button>

                {midjourneyPrompt && (
                  <pre className="bg-muted p-2 rounded-md text-xs overflow-x-auto">
                    {midjourneyPrompt}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => setLocation("/create/art-style")}>
            Back
          </Button>
          <Button onClick={() => setLocation("/story-generation")}>
            Generate Story
          </Button>
        </div>
      </div>
    </div>
  );
}