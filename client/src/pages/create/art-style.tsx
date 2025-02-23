import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const artStyles = [
  {
    value: "whimsical",
    label: "Whimsical Fantasy",
    description: "Playful and enchanting style with magical elements",
    preview: "🎨✨"
  },
  {
    value: "studio-ghibli",
    label: "Studio Ghibli Inspired",
    description: "Inspired by the magical worlds of Miyazaki",
    preview: "🎬🌟"
  },
  {
    value: "watercolor",
    label: "Dreamy Watercolor",
    description: "Soft, flowing watercolor illustrations",
    preview: "🎨💧"
  },
  {
    value: "pixel-art",
    label: "Retro Pixel Art",
    description: "Charming 16-bit style illustrations",
    preview: "👾🕹️"
  },
  {
    value: "pop-art",
    label: "Pop Art",
    description: "Bold, vibrant comic book style",
    preview: "🎨💥"
  },
  {
    value: "pencil-sketch",
    label: "Classic Pencil Sketch",
    description: "Traditional hand-drawn appearance",
    preview: "✏️📝"
  },
  {
    value: "3d-cartoon",
    label: "3D Cartoon",
    description: "Modern 3D animated style",
    preview: "🎮💫"
  },
  {
    value: "storybook",
    label: "Classic Storybook",
    description: "Traditional children's book illustrations",
    preview: "📚✨"
  }
];

export default function ArtStylePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  // Load existing selections from localStorage
  useEffect(() => {
    const savedStyles = localStorage.getItem("yorkieArtStyles");
    if (savedStyles) {
      setSelectedStyles(JSON.parse(savedStyles));
    }
  }, []);

  const handleStyleSelect = (style: string) => {
    setSelectedStyles(prev => {
      if (prev.includes(style)) {
        return prev.filter(s => s !== style);
      }
      if (prev.length >= 3) {
        toast({
          title: "Maximum Styles Selected",
          description: "You can select up to 3 art styles.",
          variant: "destructive"
        });
        return prev;
      }
      return [...prev, style];
    });
  };

  const handleNext = () => {
    if (selectedStyles.length === 0) {
      toast({
        title: "Select Art Style",
        description: "Please select at least one art style.",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem("yorkieArtStyles", JSON.stringify(selectedStyles));
    setLocation("/create/review");
  };

  const handleBack = () => {
    setLocation("/create/story");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="w-full">
          <Progress value={75} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">Step 4 of 5: Choose Art Styles</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Art Style Selection</CardTitle>
            <CardDescription>
              Choose up to three art styles to blend in your story's illustrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormItem>
              <FormLabel>Art Styles (Select up to 3)</FormLabel>
              <FormDescription>
                Mix different styles to create unique illustrations
              </FormDescription>
              <div className="grid grid-cols-2 gap-4">
                {artStyles.map((style) => (
                  <div
                    key={style.value}
                    className={`cursor-pointer rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                      selectedStyles.includes(style.value)
                        ? "border-primary bg-primary/5"
                        : "border-muted"
                    }`}
                    onClick={() => handleStyleSelect(style.value)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{style.preview}</span>
                      <span className="font-semibold">{style.label}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {style.description}
                    </div>
                  </div>
                ))}
              </div>

              {selectedStyles.length > 0 && (
                <div className="mt-4 p-4 bg-muted/20 rounded-lg">
                  <h4 className="font-semibold mb-2">Selected Styles:</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedStyles.map((styleValue) => {
                      const style = artStyles.find(s => s.value === styleValue);
                      return (
                        <div
                          key={styleValue}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          <span>{style?.preview}</span>
                          {style?.label}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStyleSelect(styleValue);
                            }}
                            className="hover:text-destructive"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </FormItem>

            <div className="flex justify-between mt-6">
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
                onClick={handleNext}
                size="lg"
                className="gap-2"
              >
                Next Step
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
