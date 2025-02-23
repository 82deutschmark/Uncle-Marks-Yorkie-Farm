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
  { value: "steel-blue", label: "Steel Blue & Tan", preview: "🔷🟫" },
  { value: "gold", label: "Golden", preview: "🟡" },
  { value: "silver", label: "Silver & Tan", preview: "⚪🟫" },
  { value: "chocolate", label: "Chocolate", preview: "🟫" },
  { value: "parti-color", label: "Parti-Color", preview: "⚪⚫" },
  { value: "blue-tan", label: "Blue & Tan", preview: "🔵🟫" },
  { value: "red", label: "Red/Mahogany", preview: "🟤" }
];

const themes = [
  { value: "farm-adventure", label: "Farm Adventure", description: "Explore Uncle Mark's Farm" },
  { value: "friendship", label: "Making Friends", description: "Meeting new animal friends" },
  { value: "helping", label: "Helping Others", description: "Being kind and helpful" },
  { value: "mystery", label: "Solving Mysteries", description: "Finding clues and solving puzzles" },
  { value: "learning", label: "Learning New Things", description: "Discovering the world" },
  { value: "courage", label: "Finding Courage", description: "Overcoming fears" }
];

export default function DetailsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      }
    }
  });

  const randomizeAll = () => {
    const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const randomArtStyle = artStyles[Math.floor(Math.random() * artStyles.length)];

    form.setValue("protagonist.personality", randomPersonality);
    form.setValue("protagonist.appearance", `A beautiful Yorkshire Terrier with ${randomColor.label.toLowerCase()} coat`);
    form.setValue("theme", randomTheme.value);
    form.setValue("artStyle", {
      style: randomArtStyle.value,
      description: randomArtStyle.description
    });

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

            <Tabs defaultValue="character" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
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

                    <FormField
                      control={form.control}
                      name="protagonist.appearance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Appearance</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => field.onChange(`A beautiful Yorkshire Terrier with ${value} coat`)}
                              defaultValue={field.value}
                              className="grid grid-cols-2 gap-4"
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
                                    <span>{color.preview}</span>
                                    <span className="mt-2">{color.label}</span>
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
                    <FormField
                      control={form.control}
                      name="artStyle.style"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Art Style</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => {
                                const style = artStyles.find(s => s.value === value);
                                form.setValue("artStyle", {
                                  style: value,
                                  description: style?.description || ""
                                });
                              }}
                              defaultValue={field.value}
                              className="grid grid-cols-2 gap-4"
                            >
                              {artStyles.map((style) => (
                                <FormItem key={style.value}>
                                  <FormControl>
                                    <RadioGroupItem
                                      value={style.value}
                                      className="peer sr-only"
                                    />
                                  </FormControl>
                                  <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <span className="text-2xl mb-2">{style.preview}</span>
                                    <span className="font-semibold">{style.label}</span>
                                    <span className="text-xs text-muted-foreground text-center mt-1">
                                      {style.description}
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

                  <div className="flex justify-end gap-4 pt-6 border-t">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      size="lg"
                      className="gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4" />
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