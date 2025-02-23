import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { artStyleSchema, storyParamsSchema } from "@shared/schema";
import type { StoryParams, ArtStyle } from "@shared/schema";
import { Palette, Wand2, BookOpen, Loader2, Shuffle } from "lucide-react";

const formSchema = storyParamsSchema;

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

const personalities = [
  "Brave and Adventurous",
  "Sweet and Gentle",
  "Clever and Curious",
  "Playful and Energetic",
  "Loyal and Protective",
  "Mischievous and Fun",
  "Elegant and Graceful",
  "Determined and Strong"
];

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
  { value: "ruby-red", label: "Ruby Red", preview: "❤️" }
];

const themes = [
  { value: "farm-adventure", label: "Farm Adventure", description: "Explore Uncle Mark's Farm" },
  { value: "friendship", label: "Making Friends", description: "Meeting new animal friends" },
  { value: "helping", label: "Helping Others", description: "Being kind and helpful" },
  { value: "mystery", label: "Solving Mysteries", description: "Finding clues and solving puzzles" },
  { value: "learning", label: "Learning New Things", description: "Discovering the world" },
  { value: "courage", label: "Finding Courage", description: "Overcoming fears" }
];

const antagonists = [
  {
    value: "sorcerer-basic",
    label: "Evil Sorcerer",
    description: "A mysterious dark wizard who wants to steal the farm's magic"
  },
  {
    value: "sorcerer-squirrels",
    label: "Sorcerer & Squirrel Army",
    description: "Evil wizard commanding an army of mischievous squirrels"
  },
  {
    value: "squirrel-gang",
    label: "The Nutty Gang",
    description: "Organized squirrels trying to steal eggs and crops"
  },
  {
    value: "dark-wizard",
    label: "Dark Wizard & Shadow Creatures",
    description: "Powerful wizard with shadow creatures threatening the farm"
  }
];

const farmElements = [
  {
    value: "chickens",
    label: "Chicken Coop",
    description: "Protect the special golden eggs"
  },
  {
    value: "turkeys",
    label: "Turkey Squad",
    description: "The farm's watchful guardians"
  },
  {
    value: "garden",
    label: "Magic Garden",
    description: "Enchanted vegetables and fruits"
  },
  {
    value: "barn",
    label: "Ancient Barn",
    description: "Full of magical farm secrets"
  }
];

export default function DetailsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedArtStyles, setSelectedArtStyles] = useState<string[]>([]);

  const form = useForm<StoryParams>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      protagonist: {
        personality: "",
        appearance: ""
      },
      theme: "farm-adventure",
      mood: "Lighthearted",
      artStyle: {
        style: "whimsical",
        description: "A playful and enchanting style perfect for children's stories"
      },
      antagonist: {
        type: "sorcerer-squirrels",
        description: "Evil wizard commanding an army of mischievous squirrels"
      },
      farmElements: ["chickens", "garden"]
    }
  });

  const handleArtStyleSelect = (style: string) => {
    setSelectedArtStyles(prev => {
      if (prev.includes(style)) {
        return prev.filter(s => s !== style);
      }
      if (prev.length >= 3) {
        toast({
          title: "Maximum Styles Selected",
          description: "You can select up to 3 art styles.",
          variant: "warning"
        });
        return prev;
      }
      return [...prev, style];
    });
  };

  const randomizeAll = () => {
    const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const randomArtStyles = [];
    const numStyles = Math.floor(Math.random() * 2) + 1; // 1-2 random styles

    while (randomArtStyles.length < numStyles) {
      const style = artStyles[Math.floor(Math.random() * artStyles.length)];
      if (!randomArtStyles.includes(style.value)) {
        randomArtStyles.push(style.value);
      }
    }

    const randomAntagonist = antagonists[Math.floor(Math.random() * antagonists.length)];
    const randomFarmElements = farmElements
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map(e => e.value);

    form.setValue("protagonist.personality", randomPersonality);
    form.setValue("protagonist.appearance", `A beautiful Yorkshire Terrier with ${randomColor.label.toLowerCase()} coat`);
    form.setValue("theme", randomTheme.value);
    setSelectedArtStyles(randomArtStyles);
    form.setValue("antagonist", {
      type: randomAntagonist.value,
      description: randomAntagonist.description
    });
    form.setValue("farmElements", randomFarmElements);

    toast({
      title: "Story Elements Randomized!",
      description: "Feel free to adjust any options you'd like to change.",
    });
  };

  const onSubmit = async (data: StoryParams) => {
    setIsSubmitting(true);
    toast({
      title: "Creating Your Story",
      description: "Please wait while we craft your tale...",
    });

    try {
      localStorage.setItem("storyParams", JSON.stringify(data));
      setLocation("/story-generation");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Design Your Perfect Story</CardTitle>
            <CardDescription>
              Customize your Yorkshire Terrier tale or use the randomize button for instant inspiration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-6">
              <Button
                onClick={randomizeAll}
                variant="outline"
                className="gap-2"
              >
                <Shuffle className="h-4 w-4" />
                Randomize All
              </Button>
            </div>

            <Tabs defaultValue="appearance" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="appearance" className="space-x-2">
                  <Palette className="h-4 w-4" />
                  <span>Appearance</span>
                </TabsTrigger>
                <TabsTrigger value="character" className="space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Character</span>
                </TabsTrigger>
                <TabsTrigger value="story" className="space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Story</span>
                </TabsTrigger>
                <TabsTrigger value="art" className="space-x-2">
                  <Palette className="h-4 w-4" />
                  <span>Art Style</span>
                </TabsTrigger>
              </TabsList>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <TabsContent value="appearance" className="space-y-6">
                    <FormField
                      control={form.control}
                      name="protagonist.appearance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yorkie's Colors</FormLabel>
                          <FormDescription>
                            Choose your Yorkie's unique color combination
                          </FormDescription>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => field.onChange(`A beautiful Yorkshire Terrier with ${value} coat`)}
                              defaultValue={field.value}
                              className="grid grid-cols-3 gap-4"
                            >
                              {colors.map((color) => (
                                <FormItem key={color.value}>
                                  <FormControl>
                                    <RadioGroupItem
                                      value={color.label.toLowerCase()}
                                      className="peer sr-only"
                                    />
                                  </FormControl>
                                  <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <span className="text-2xl">{color.preview}</span>
                                    <span className="mt-2 text-center">{color.label}</span>
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="character" className="space-y-6">
                    <FormField
                      control={form.control}
                      name="protagonist.personality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personality</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-2 gap-4"
                            >
                              {personalities.map((personality) => (
                                <FormItem key={personality}>
                                  <FormControl>
                                    <RadioGroupItem
                                      value={personality}
                                      className="peer sr-only"
                                    />
                                  </FormControl>
                                  <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    {personality}
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="story" className="space-y-6">
                    <FormField
                      control={form.control}
                      name="antagonist.type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Villain</FormLabel>
                          <FormDescription>
                            Choose who your Yorkie will face off against
                          </FormDescription>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => {
                                const antagonist = antagonists.find(a => a.value === value);
                                form.setValue("antagonist", {
                                  type: value,
                                  description: antagonist?.description || ""
                                });
                              }}
                              defaultValue={field.value}
                              className="grid grid-cols-2 gap-4"
                            >
                              {antagonists.map((ant) => (
                                <FormItem key={ant.value}>
                                  <FormControl>
                                    <RadioGroupItem
                                      value={ant.value}
                                      className="peer sr-only"
                                    />
                                  </FormControl>
                                  <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <span className="font-semibold">{ant.label}</span>
                                    <span className="text-sm text-muted-foreground text-center mt-1">
                                      {ant.description}
                                    </span>
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="farmElements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Farm Elements</FormLabel>
                          <FormDescription>
                            Select the magical farm elements in your story
                          </FormDescription>
                          <FormControl>
                            <div className="grid grid-cols-2 gap-4">
                              {farmElements.map((element) => (
                                <div
                                  key={element.value}
                                  className={`cursor-pointer rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                                    field.value?.includes(element.value)
                                      ? "border-primary bg-primary/5"
                                      : "border-muted"
                                  }`}
                                  onClick={() => {
                                    const newValue = field.value?.includes(element.value)
                                      ? field.value.filter(v => v !== element.value)
                                      : [...(field.value || []), element.value];
                                    field.onChange(newValue);
                                  }}
                                >
                                  <div className="font-semibold">{element.label}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {element.description}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Story Theme</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-2 gap-4"
                            >
                              {themes.map((theme) => (
                                <FormItem key={theme.value}>
                                  <FormControl>
                                    <RadioGroupItem
                                      value={theme.value}
                                      className="peer sr-only"
                                    />
                                  </FormControl>
                                  <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <span className="font-semibold">{theme.label}</span>
                                    <span className="text-sm text-muted-foreground text-center mt-1">
                                      {theme.description}
                                    </span>
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="art" className="space-y-6">
                    <FormItem>
                      <FormLabel>Art Styles (Select up to 3)</FormLabel>
                      <FormDescription>
                        Choose up to three art styles to blend in your story's illustrations
                      </FormDescription>
                      <div className="grid grid-cols-2 gap-4">
                        {artStyles.map((style) => (
                          <div
                            key={style.value}
                            className={`cursor-pointer rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                              selectedArtStyles.includes(style.value)
                                ? "border-primary bg-primary/5"
                                : "border-muted"
                            }`}
                            onClick={() => handleArtStyleSelect(style.value)}
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
                    </FormItem>
                  </TabsContent>

                  <div className="flex justify-end gap-4 pt-6 border-t">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      size="lg"
                      className="gap-2"
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
                </form>
              </Form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}