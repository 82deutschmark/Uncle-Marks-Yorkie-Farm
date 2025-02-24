import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Sparkles, Wand2, RefreshCcw, Loader2 } from "lucide-react";

interface YorkieImage {
  id: string;
  url: string;
  description?: string;
}

const colors = [
  { value: "black-tan", label: "Classic Black & Tan", preview: "⚫🟫" },
  { value: "neon-pink", label: "Neon Pink & Purple", preview: "💖💜" },
  { value: "pastel-rainbow", label: "Pastel Rainbow", preview: "🌈✨" }
  // ... other colors
];

const artStyles = [
  { value: "whimsical", label: "Whimsical", description: "Playful and magical style" },
  { value: "studio-ghibli", label: "Studio Ghibli", description: "Inspired by the famous animation studio" },
  { value: "watercolor", label: "Watercolor", description: "Soft and dreamy watercolor effects" }
  // ... other styles
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [yorkies, setYorkies] = useState<YorkieImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedYorkie, setSelectedYorkie] = useState<YorkieImage | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState("");

  const fetchRandomYorkies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/images/random');
      const data = await response.json();
      setYorkies(data.images);
    } catch (error) {
      console.error('Failed to fetch Yorkies:', error);
      toast({
        title: "Error",
        description: "Failed to load Yorkie images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const randomizeSelections = () => {
    // Randomly select colors and art style
    const randomColors = colors
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 1)
      .map(c => c.label);

    const randomStyle = artStyles[Math.floor(Math.random() * artStyles.length)].value;

    setSelectedColors(randomColors);
    setSelectedStyle(randomStyle);
  };

  const handleGenerateStory = async () => {
    if (!selectedYorkie) {
      toast({
        title: "Select a Yorkie",
        description: "Please select a Yorkie first to generate your story.",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      // Call the API to generate the story
      const response = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          yorkieId: selectedYorkie.id,
          colors: selectedColors,
          artStyle: selectedStyle,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate story');

      const data = await response.json();
      // Navigate to the story view page with the generated story
      setLocation(`/story/${data.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate your story. Please try again.",
        variant: "destructive"
      });
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchRandomYorkies();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-background py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-serif tracking-tight text-primary sm:text-6xl">
              Uncle Mark's Yorkie Tales
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Create magical storybooks featuring delightful Yorkshire Terriers
            </p>
          </div>

          <div className="mt-16">
            <Card className="w-full max-w-4xl mx-auto border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Create Your Yorkie Story</CardTitle>
                <CardDescription className="text-center">
                  Customize your magical companion or use the randomize button for a quick adventure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Yorkie Selection */}
                <div className="grid md:grid-cols-3 gap-6">
                  {yorkies.map((yorkie) => (
                    <div 
                      key={yorkie.id} 
                      className={`relative cursor-pointer ${
                        selectedYorkie?.id === yorkie.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedYorkie(yorkie)}
                    >
                      <div className="aspect-square mb-4 relative overflow-hidden rounded-lg">
                        <img 
                          src={yorkie.url} 
                          alt="Yorkshire Terrier" 
                          className="object-cover w-full h-full"
                        />
                      </div>
                      {yorkie.description && (
                        <p className="text-sm text-muted-foreground">{yorkie.description}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Customization Options */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="colors">
                    <AccordionTrigger>Yorkie's Colors</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-3 gap-4">
                        {colors.map((color) => (
                          <div
                            key={color.value}
                            className={`cursor-pointer rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                              selectedColors.includes(color.label)
                                ? "border-primary bg-primary/5"
                                : "border-muted"
                            }`}
                            onClick={() => {
                              if (selectedColors.includes(color.label)) {
                                setSelectedColors(selectedColors.filter(c => c !== color.label));
                              } else if (selectedColors.length < 3) {
                                setSelectedColors([...selectedColors, color.label]);
                              }
                            }}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-2xl">{color.preview}</span>
                              <span className="text-center">{color.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="style">
                    <AccordionTrigger>Art Style</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        {artStyles.map((style) => (
                          <div
                            key={style.value}
                            className={`cursor-pointer rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                              selectedStyle === style.value
                                ? "border-primary bg-primary/5"
                                : "border-muted"
                            }`}
                            onClick={() => setSelectedStyle(style.value)}
                          >
                            <h3 className="font-semibold">{style.label}</h3>
                            <p className="text-sm text-muted-foreground">{style.description}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={randomizeSelections}
                    className="gap-2"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Randomize
                  </Button>

                  <Button
                    onClick={handleGenerateStory}
                    disabled={generating || !selectedYorkie}
                    size="lg"
                    className="gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating Magic...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Generate Story
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}