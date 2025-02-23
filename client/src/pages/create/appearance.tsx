import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const colors = [
  { value: "black-tan", label: "Classic Black & Tan", preview: "⚫🟫" },
  { value: "neon-pink", label: "Neon Pink & Purple", preview: "💖💜" },
  { value: "pastel-rainbow", label: "Pastel Rainbow", preview: "🌈✨" },
  { value: "electric-blue", label: "Electric Blue & Silver", preview: "⚡⚪" },
  { value: "cosmic-purple", label: "Cosmic Purple & Gold", preview: "🔮✨" },
  { value: "rose-gold", label: "Rose Gold & Pink", preview: "🌹💗" },
  { value: "mint-lavender", label: "Mint & Lavender", preview: "🌿💜" },
  { value: "sunset-orange", label: "Sunset Orange & Pink", preview: "🌅💗" },
  { value: "steel-blue", label: "Steel Blue & Tan", preview: "🔷🟫" },
  { value: "golden-shimmer", label: "Golden Shimmer", preview: "🌟✨" },
  { value: "silver-sparkle", label: "Silver & Sparkles", preview: "⚪✨" },
  { value: "chocolate", label: "Rich Chocolate", preview: "🟫" },
  { value: "parti-neon", label: "Parti Neon", preview: "💫🌈" },
  { value: "blue-tan", label: "Classic Blue & Tan", preview: "🔵🟫" },
  { value: "ruby-red", label: "Ruby Red", preview: "❤️" },
  { value: "galaxy-swirl", label: "Galaxy Swirl", preview: "🌌✨" },
  { value: "cotton-candy", label: "Cotton Candy", preview: "🍬💝" },
  { value: "emerald-gold", label: "Emerald & Gold", preview: "💚✨" },
  { value: "unicorn", label: "Unicorn Fantasy", preview: "🦄✨" },
  { value: "aurora", label: "Aurora Lights", preview: "🌈🌟" }
];

export default function AppearancePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  // Load any existing selections from localStorage
  useEffect(() => {
    const savedColors = localStorage.getItem("yorkieColors");
    if (savedColors) {
      setSelectedColors(JSON.parse(savedColors));
    }
  }, []);

  const handleColorSelect = (colorLabel: string) => {
    setSelectedColors(prev => {
      let newColors;
      if (prev.includes(colorLabel)) {
        newColors = prev.filter(c => c !== colorLabel);
      } else {
        if (prev.length >= 3) {
          toast({
            title: "Maximum Colors Selected",
            description: "You can select up to 3 colors for your Yorkie.",
            variant: "destructive"
          });
          return prev;
        }
        newColors = [...prev, colorLabel];
      }
      // Save to localStorage
      localStorage.setItem("yorkieColors", JSON.stringify(newColors));
      return newColors;
    });
  };

  const handleNext = () => {
    if (selectedColors.length === 0) {
      toast({
        title: "Select Colors",
        description: "Please select at least one color for your Yorkie.",
        variant: "destructive"
      });
      return;
    }

    // Save the appearance description
    localStorage.setItem("yorkieAppearance", 
      `A beautiful Yorkshire Terrier with a magical blend of ${selectedColors.join(", ").toLowerCase()} colors`
    );

    setLocation("/create/character");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="w-full">
          <Progress value={25} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">Step 1 of 4: Choose Your Yorkie's Colors</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Design Your Perfect Yorkie</CardTitle>
            <CardDescription>
              Start by selecting up to three magical colors for your Yorkshire Terrier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <h3 className="text-base font-semibold mb-2">Yorkie's Colors (Select up to 3)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Mix and match up to three magical colors for your Yorkie
              </p>
              <div className="grid grid-cols-3 gap-4">
                {colors.map((color) => (
                  <div
                    key={color.value}
                    className={`cursor-pointer rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                      selectedColors.includes(color.label)
                        ? "border-primary bg-primary/5"
                        : "border-muted"
                    }`}
                    onClick={() => handleColorSelect(color.label)}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">{color.preview}</span>
                      <span className="text-center">{color.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedColors.length > 0 && (
                <div className="mt-4 p-4 bg-muted/20 rounded-lg">
                  <h4 className="font-semibold mb-2">Selected Colors:</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedColors.map((color) => (
                      <div
                        key={color}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {color}
                        <button
                          onClick={() => handleColorSelect(color)}
                          className="hover:text-destructive"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
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