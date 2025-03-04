import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Loader2, ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface StoryParams {
  colors: string[];
  characteristics: string[];
  theme: string;
  antagonist: string;
  farmElements: string[];
  artStyle: string;
  selectedImage?: string;
}

export default function ReviewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [storyParams, setStoryParams] = useState<StoryParams | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);

  useEffect(() => {
    // Load all saved parameters from localStorage
    const colors = localStorage.getItem("yorkieColors");
    const characteristics = localStorage.getItem("yorkieCharacteristics");
    const theme = localStorage.getItem("yorkieTheme");
    const antagonist = localStorage.getItem("yorkieAntagonist");
    const farmElements = localStorage.getItem("yorkieElements");
    const artStyle = localStorage.getItem("yorkieArtStyle");
    const selectedImage = localStorage.getItem("yorkieImage");

    if (!colors || !characteristics || !theme || !antagonist || !farmElements || !artStyle) {
      toast({
        title: "Missing Information",
        description: "Please complete all previous steps before reviewing.",
        variant: "destructive"
      });
      setLocation("/create/appearance");
      return;
    }

    setStoryParams({
      colors: JSON.parse(colors),
      characteristics: JSON.parse(characteristics),
      theme,
      antagonist,
      farmElements: JSON.parse(farmElements),
      artStyle,
      selectedImage: selectedImage || undefined
    });
  }, []);

  const handleGenerateStory = () => {
    if (!storyParams) return;
    
    // Make sure we have an antagonist with valid type
    if (!storyParams.antagonist) {
      storyParams.antagonist = {
        type: "squirrel-gang", // Using a valid enum value from the schema
        personality: "Mischievous and sneaky"
      };
    } else if (storyParams.antagonist.type === "squirrel") {
      // Fix invalid antagonist type
      storyParams.antagonist.type = "squirrel-gang";
    }
    
    // Ensure artStyle has description field
    if (storyParams.artStyle && !storyParams.artStyle.description) {
      storyParams.artStyle.description = storyParams.artStyle.details || "Colorful and expressive";
    }
    
    // Add required farmElements if missing
    if (!storyParams.farmElements) {
      storyParams.farmElements = ["barn", "tractor", "fields"];
    }

    // Save complete story parameters
    localStorage.setItem("storyParams", JSON.stringify(storyParams));
    setIsLoading(true);

    // Navigate to story generation page
    setLocation("/create/story-generation");
  };

  const handleGenerateImage = async () => {
    if (!storyParams) return;
    setIsGeneratingImage(true);
    //  Add DALL-E API call here.  Placeholder for now.
    const imageURL = "placeholder_image_url"; // Replace with actual DALL-E response
    setGeneratedImage(imageURL);
    setIsGeneratingImage(false);
    setShowImageDialog(true);
  };

  if (!storyParams) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Review Your Story Parameters</CardTitle>
            <CardDescription>
              Review all your selections before generating your story
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-6">
                {/* Yorkie Appearance */}
                <div>
                  <h3 className="font-semibold mb-2">Yorkie's Colors</h3>
                  <div className="flex flex-wrap gap-2">
                    {storyParams.colors.map((color) => (
                      <Badge key={color} variant="outline">{color}</Badge>
                    ))}
                  </div>
                </div>

                {/* Character Traits */}
                <div>
                  <h3 className="font-semibold mb-2">Character Traits</h3>
                  <div className="flex flex-wrap gap-2">
                    {storyParams.characteristics.map((trait) => (
                      <Badge key={trait} variant="outline">{trait}</Badge>
                    ))}
                  </div>
                </div>

                {/* Story Elements */}
                <div>
                  <h3 className="font-semibold mb-2">Story Elements</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Theme:</span>
                      <Badge className="ml-2" variant="outline">{storyParams.theme}</Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Antagonist:</span>
                      <Badge className="ml-2" variant="outline">{storyParams.antagonist}</Badge>
                    </div>
                  </div>
                </div>

                {/* Farm Elements */}
                <div>
                  <h3 className="font-semibold mb-2">Farm Elements</h3>
                  <div className="flex flex-wrap gap-2">
                    {storyParams.farmElements.map((element) => (
                      <Badge key={element} variant="outline">{element}</Badge>
                    ))}
                  </div>
                </div>

                {/* Art Style */}
                <div>
                  <h3 className="font-semibold mb-2">Art Style</h3>
                  <Badge variant="outline">{storyParams.artStyle}</Badge>
                </div>

                {/* Selected Image */}
                {storyParams.selectedImage && (
                  <div>
                    <h3 className="font-semibold mb-2">Selected Yorkie</h3>
                    <img
                      src={storyParams.selectedImage}
                      alt="Selected Yorkie"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex justify-between mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => setLocation("/create/art-style")}>
                Back
              </Button>
              <div className="flex gap-4">
                <Button onClick={handleGenerateImage} disabled={isGeneratingImage} size="lg" className="gap-2">
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Image...
                    </>
                  ) : (
                    <>Generate Image <ImageIcon className="h-4 w-4" /></>
                  )}
                </Button>
                <Button
                  onClick={handleGenerateStory}
                  disabled={isLoading}
                  size="lg"
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      Generate Story
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogTitle>Generated Image</DialogTitle>
          <DialogContent>
            {generatedImage && (
              <img src={generatedImage} alt="Generated Image" className="max-w-full" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}