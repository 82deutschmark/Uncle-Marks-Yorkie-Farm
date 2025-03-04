import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Upload, BookOpen, Sparkles, Wand2, RefreshCcw, Loader2 } from "lucide-react";

interface YorkieImage {
  id: number;
  url: string;
  description?: string;
}

interface YorkieAnalysis {
  name: string;
  personality: string;
  description: string;
  suggestedNames: string[];
  artStyle: string;
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
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [yorkieAnalysis, setYorkieAnalysis] = useState<YorkieAnalysis | null>(null);
  const [generatedStory, setGeneratedStory] = useState<any | null>(null); // Added state for generated story
  const [showStoryDialog, setShowStoryDialog] = useState(false); // Added state for dialog
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // Added state for selected image


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

  const analyzeYorkie = async (yorkie: YorkieImage) => {
    setAnalyzing(true);
    setShowAnalysis(true);
    try {
      const response = await fetch(`/api/images/${yorkie.id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze image');
      }

      const analysis = await response.json();
      setYorkieAnalysis(analysis);
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze the Yorkie. Please try again.",
        variant: "destructive"
      });
      setShowAnalysis(false);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateStory = async () => {
    if (!yorkieAnalysis) return;

    setGenerating(true);
    try {
      // Generate image first
      const imageResponse = await fetch("/api/images/generate", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artStyle: selectedStyle,
          colors: selectedColors,
          yorkieId: yorkieAnalysis.id
        })
      });

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        toast({
          title: "Image Generation Failed",
          description: errorData.message || "Failed to generate your image",
          variant: "destructive"
        });
        return;
      }

      const imageURL = await imageResponse.json();
      setSelectedImage(imageURL.url);


      // Make a real call to our story generation API
      try {
        const storyParams = {
          protagonist: {
            name: yorkieAnalysis.name || "",
            personality: yorkieAnalysis.personality || "Brave and curious",
            appearance: `A beautiful Yorkshire Terrier with a magical blend of ${selectedColors.join(", ").toLowerCase()} colors`
          },
          antagonist: {
            type: "squirrel-gang",  // Changed antagonist type
            personality: "Mischievous and sneaky"
          },
          theme: "Adventure",
          mood: "Lighthearted",
          artStyle: {
            style: selectedStyle,
            description: "Colorful and vibrant" // Added description
          },
          farmElements: ["barn", "tractor", "fields"] // Added farmElements
        };

        const storyResponse = await fetch('/api/stories/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(storyParams)
        });

        if (!storyResponse.ok) {
          throw new Error("Failed to generate story");
        }

        const realStory = await storyResponse.json();
        setGeneratedStory(realStory);
        setShowStoryDialog(true);
      } catch (error) {
        console.error('Story generation error:', error);
        // Fallback to mock story if the API call fails
        const mockStory = {
          id: Date.now(),
          title: `${yorkieAnalysis.name || "Yorkie"}'s ${selectedStyle} Adventure`,
          content: `Once upon a time, there was a brave Yorkshire Terrier. 
          With beautiful ${selectedColors.join(' and ')} fur, this little hero went on many adventures.

          This is a placeholder story because we couldn't connect to our story service.`,
          metadata: {
            protagonist: {
              name: yorkieAnalysis.name || "",
              personality: yorkieAnalysis.personality || "Brave and curious"
            },
            image_urls: ["/placeholder-image.jpg"],
            wordCount: 50,
            chapters: 1,
            tone: "Lighthearted"
          }
        };
        setGeneratedStory(mockStory);
        setShowStoryDialog(true);
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
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
                  Click on any Yorkie to learn more about them, or just hit generate for a magical surprise!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {yorkies && yorkies.length > 0 ? yorkies.map((yorkie) => (
                    <div
                      key={yorkie.id}
                      className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                        selectedYorkie?.id === yorkie.id ? 'ring-2 ring-primary scale-[1.02]' : 'hover:scale-[1.02]'
                      }`}
                      onClick={() => {
                        setSelectedYorkie(yorkie);
                        analyzeYorkie(yorkie);
                      }}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={yorkie.url}
                          alt="Yorkshire Terrier"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-muted-foreground">No yorkies found. Try uploading an image first.</p>
                    </div>
                  )}
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="customize">
                    <AccordionTrigger>Customize Your Story (Optional)</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Yorkie's Colors (Optional)</h3>
                          <ScrollArea className="h-[200px]">
                            <div className="grid grid-cols-4 gap-2">
                              {colors.map((color) => (
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
                                    } else {
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
                          </ScrollArea>
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
                                onClick={() => setSelectedStyle(
                                  selectedStyle === style.value ? "" : style.value
                                )}
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

      {/* Yorkie Analysis Dialog */}
      <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Yorkie Analysis</DialogTitle>
          </DialogHeader>
          {analyzing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : yorkieAnalysis ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Art Style</h3>
                <p className="text-muted-foreground">{yorkieAnalysis.artStyle}</p>
              </div>
              <div>
                <h3 className="font-medium">Character Description</h3>
                <p className="text-muted-foreground">{yorkieAnalysis.description}</p>
              </div>
              <div>
                <h3 className="font-medium">Personality</h3>
                <p className="text-muted-foreground">{yorkieAnalysis.personality}</p>
              </div>
              <div>
                <h3 className="font-medium">Suggested Names</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {yorkieAnalysis.suggestedNames?.map((name, index) => (
                    <Badge key={index} variant="secondary">{name}</Badge>
                  )) || (
                    <Badge variant="secondary">Yorkie Hero</Badge>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Failed to analyze the Yorkie. Please try again.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Story Dialog */}
      <Dialog open={showStoryDialog} onOpenChange={setShowStoryDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{generatedStory?.title}</DialogTitle>
            <DialogDescription>Your story has been created!</DialogDescription>
          </DialogHeader>
          <div className="p-4">
            {generatedStory && (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  {selectedImage && (
                    <img
                      src={selectedImage}
                      alt="Yorkie"
                      className="rounded-lg max-h-64 object-contain"
                    />
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <p className="whitespace-pre-line">{generatedStory.content}</p>
                </div>
                <div className="flex justify-between">
                  <Button onClick={() => setShowStoryDialog(false)}>Close</Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      setShowStoryDialog(false);
                      if (generatedStory?.id) {
                        setLocation(`/story/${generatedStory.id}`);
                      }
                    }}
                  >
                    View Full Story
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}