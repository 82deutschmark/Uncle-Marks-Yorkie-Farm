import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, BookOpen, Sparkles, Wand2, RefreshCcw, Loader2 } from "lucide-react";

interface YorkieImage {
  id: string;
  url: string;
  description?: string;
}

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

const artStyles = [
  { value: "whimsical", label: "Whimsical", description: "Playful and magical style" },
  { value: "studio-ghibli", label: "Studio Ghibli", description: "Inspired by the famous animation studio" },
  { value: "watercolor", label: "Watercolor", description: "Soft and dreamy watercolor effects" },
  { value: "pixel-art", label: "Pixel Art", description: "Charming retro pixel graphics" },
  { value: "pop-art", label: "Pop Art", description: "Bold and vibrant comic style" },
  { value: "pencil-sketch", label: "Pencil Sketch", description: "Traditional hand-drawn look" },
  { value: "3d-cartoon", label: "3D Cartoon", description: "Modern 3D animated style" },
  { value: "storybook", label: "Classic Storybook", description: "Traditional children's book art" }
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
      // Auto-select the first Yorkie
      if (data.images && data.images.length > 0) {
        setSelectedYorkie(data.images[0]);
      }
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

  const handleGenerateStory = async () => {
    setGenerating(true);
    try {
      // If no colors selected, randomly select some
      const colorsToUse = selectedColors.length > 0 ? selectedColors : 
        colors.sort(() => Math.random() - 0.5).slice(0, 2).map(c => c.label);

      // If no style selected, randomly select one
      const styleToUse = selectedStyle || artStyles[Math.floor(Math.random() * artStyles.length)].value;

      const response = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          yorkieId: selectedYorkie?.id || yorkies[0]?.id,
          colors: colorsToUse,
          artStyle: styleToUse,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate story');

      const data = await response.json();
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

          {/* Contributor Quick Access - Made less prominent */}
          <div className="mt-8 flex justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/upload")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Upload className="h-4 w-4 mr-2" />
              Contributor
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/debug")}
              className="text-muted-foreground hover:text-foreground"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Debug
            </Button>
          </div>

          <div className="mt-16">
            <Card className="w-full max-w-4xl mx-auto border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Create Your Yorkie Story</CardTitle>
                <CardDescription className="text-center">
                  Choose your magical companion or let us pick one for you!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {yorkies.map((yorkie) => (
                    <div
                      key={yorkie.id}
                      className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                        selectedYorkie?.id === yorkie.id ? 'ring-2 ring-primary scale-[1.02]' : 'hover:scale-[1.02]'
                      }`}
                      onClick={() => setSelectedYorkie(yorkie)}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={yorkie.url}
                          alt="Yorkshire Terrier"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="customize">
                    <AccordionTrigger>Customize Your Story (Optional)</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Yorkie's Colors (Optional)</h3>
                          <div className="grid grid-cols-4 gap-2">
                            {colors.slice(0, 8).map((color) => (
                              <div
                                key={color.value}
                                className={`cursor-pointer rounded-md border p-2 hover:bg-accent hover:text-accent-foreground ${
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
                                <div className="flex flex-col items-center">
                                  <span className="text-lg">{color.preview}</span>
                                  <span className="text-xs text-center mt-1">{color.label}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-2">Art Style (Optional)</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {artStyles.map((style) => (
                              <div
                                key={style.value}
                                className={`cursor-pointer rounded-md border p-2 hover:bg-accent hover:text-accent-foreground ${
                                  selectedStyle === style.value
                                    ? "border-primary bg-primary/5"
                                    : "border-muted"
                                }`}
                                onClick={() => setSelectedStyle(style.value)}
                              >
                                <div className="font-medium">{style.label}</div>
                                <div className="text-xs text-muted-foreground">{style.description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="flex justify-center gap-4 pt-6">
                  <Button
                    onClick={handleGenerateStory}
                    disabled={generating}
                    size="lg"
                    className="gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating Magic...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5" />
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