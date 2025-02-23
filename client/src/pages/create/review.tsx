import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Wand2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface StoryDetails {
  colors: string[];
  personality: string;
  theme: string;
  antagonist: string;
  farmElements: string[];
  artStyles: string[];
}

export default function ReviewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    const details: StoryDetails = {
      colors: JSON.parse(localStorage.getItem("yorkieColors") || "[]"),
      personality: localStorage.getItem("yorkiePersonality") || "",
      theme: localStorage.getItem("yorkieTheme") || "",
      antagonist: localStorage.getItem("yorkieAntagonist") || "",
      farmElements: JSON.parse(localStorage.getItem("yorkieElements") || "[]"),
      artStyles: JSON.parse(localStorage.getItem("yorkieArtStyles") || "[]")
    };
    setStoryDetails(details);
  }, []);

  const handleCreate = async () => {
    // Validate all required fields are present
    if (!storyDetails.colors.length || !storyDetails.personality || 
        !storyDetails.theme || !storyDetails.antagonist || 
        !storyDetails.farmElements.length || !storyDetails.artStyles.length) {
      toast({
        title: "Missing Information",
        description: "Please complete all previous steps before creating your story.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Save all details for the story generation page
      localStorage.setItem("storyParams", JSON.stringify({
        protagonist: {
          personality: storyDetails.personality,
          appearance: `A beautiful Yorkshire Terrier with a magical blend of ${storyDetails.colors.join(", ").toLowerCase()} colors`
        },
        theme: storyDetails.theme,
        mood: "Lighthearted",
        artStyle: {
          style: storyDetails.artStyles.join(", "),
          description: "A unique blend of artistic styles"
        },
        antagonist: {
          type: storyDetails.antagonist,
        },
        farmElements: storyDetails.farmElements
      }));

      // Redirect to debug page instead of story-generation
      setLocation("/debug");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to prepare story generation. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setLocation("/create/art-style");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="w-full">
          <Progress value={100} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">Final Step: Review & Create</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Review Your Story</CardTitle>
            <CardDescription>
              Review all your choices before creating your magical Yorkie tale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
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
              </div>
            </ScrollArea>

            <div className="flex justify-between mt-6 pt-6 border-t">
              <Button
                onClick={handleBack}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleCreate}
                size="lg"
                className="gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Create Story
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}