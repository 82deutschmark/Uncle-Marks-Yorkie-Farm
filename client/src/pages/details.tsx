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
import { Palette, Wand2, BookOpen, Loader2 } from "lucide-react";

const formSchema = storyParamsSchema;

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
      antagonist: {
        type: "Mischievous Squirrel",
        personality: "playful troublemaker"
      },
      theme: "Adventure",
      mood: "Lighthearted",
      artStyle: {
        style: "whimsical",
        description: "A playful and enchanting style perfect for children's stories"
      }
    }
  });

  const onSubmit = async (data: StoryParams) => {
    setIsSubmitting(true);
    toast({
      title: "Creating Your Story",
      description: "Please wait while we craft your tale...",
    });

    try {
      // Here we'll make the API call to generate the story and images
      // This will be implemented in the next step
      console.log("Submitted data:", data);
      
      // For now, just show a success message
      toast({
        title: "Story Details Saved",
        description: "Your story is being created...",
      });
      
      // Navigate to the story page (to be implemented)
      // setLocation(`/story/${response.id}`);
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
            <CardTitle className="text-2xl font-serif">Customize Your Story</CardTitle>
            <CardDescription>
              Design your perfect Yorkshire Terrier tale at Uncle Mark's Farm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="story" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="story" className="space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Story Elements</span>
                </TabsTrigger>
                <TabsTrigger value="art" className="space-x-2">
                  <Palette className="h-4 w-4" />
                  <span>Art Style</span>
                </TabsTrigger>
              </TabsList>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <TabsContent value="story" className="space-y-6">
                    {/* Protagonist Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Your Yorkie Hero</h3>
                      <FormField
                        control={form.control}
                        name="protagonist.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Give your Yorkie a name..." {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="protagonist.personality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personality</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your Yorkie's personality..."
                                className="resize-none"
                                {...field}
                              />
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
                              <Textarea 
                                placeholder="Describe how your Yorkie looks..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Story Elements */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Story Elements</h3>
                      <FormField
                        control={form.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-2 gap-4"
                              >
                                {["Adventure", "Friendship", "Discovery", "Helping Others"].map((theme) => (
                                  <FormItem key={theme}>
                                    <FormControl>
                                      <RadioGroupItem
                                        value={theme}
                                        className="peer sr-only"
                                      />
                                    </FormControl>
                                    <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                      {theme}
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
                        name="mood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mood</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-2 gap-4"
                              >
                                {["Lighthearted", "Exciting", "Mysterious", "Heartwarming"].map((mood) => (
                                  <FormItem key={mood}>
                                    <FormControl>
                                      <RadioGroupItem
                                        value={mood}
                                        className="peer sr-only"
                                      />
                                    </FormControl>
                                    <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                      {mood}
                                    </FormLabel>
                                  </FormItem>
                                ))}
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="art" className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Choose Art Style</h3>
                      <FormField
                        control={form.control}
                        name="artStyle.style"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-2 gap-4"
                              >
                                {[
                                  {
                                    value: "whimsical",
                                    label: "Whimsical",
                                    description: "Playful and enchanting style perfect for children's stories"
                                  },
                                  {
                                    value: "studio-ghibli",
                                    label: "Studio Ghibli",
                                    description: "Inspired by the magical animation style of Studio Ghibli"
                                  },
                                  {
                                    value: "watercolor",
                                    label: "Watercolor",
                                    description: "Soft, dreamy watercolor illustrations"
                                  },
                                  {
                                    value: "digital-art",
                                    label: "Digital Art",
                                    description: "Modern, vibrant digital illustration style"
                                  },
                                  {
                                    value: "cartoon",
                                    label: "Cartoon",
                                    description: "Fun and expressive cartoon style"
                                  },
                                  {
                                    value: "realistic",
                                    label: "Realistic",
                                    description: "Detailed, lifelike illustrations"
                                  }
                                ].map((style) => (
                                  <FormItem key={style.value}>
                                    <FormControl>
                                      <RadioGroupItem
                                        value={style.value}
                                        className="peer sr-only"
                                      />
                                    </FormControl>
                                    <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                      <span className="font-semibold">{style.label}</span>
                                      <span className="text-xs text-muted-foreground text-center">
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
                    </div>
                  </TabsContent>

                  <div className="flex justify-end gap-4">
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
