import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { TagSelector } from "./tag-selector";

interface StoryFormData {
  characteristics: string;
  colors: string;
  theme: string;
}

const characteristics = [
  { label: "Brave", emoji: "🦁" },
  { label: "Playful", emoji: "🎾" },
  { label: "Clever", emoji: "🧠" },
  { label: "Adventurous", emoji: "🗺️" },
  { label: "Loyal", emoji: "❤️" },
  { label: "Energetic", emoji: "⚡" },
  { label: "Feisty", emoji: "💪" },
  { label: "Affectionate", emoji: "🥰" },
  { label: "Alert", emoji: "👀" },
  { label: "Confident", emoji: "✨" }
];

const colors = [
  { label: "Black", emoji: "⚫" },
  { label: "Tan", emoji: "🟫" },
  { label: "Silver", emoji: "⚪" },
  { label: "Gold", emoji: "🟡" },
  { label: "Blue", emoji: "🔵" },
  { label: "Parti", emoji: "🎨" }
];

const themes = [
  { label: "Protecting the Farm", emoji: "🏡" },
  { label: "Friendship", emoji: "🤝" },
  { label: "Courage", emoji: "💪" },
  { label: "Discovery", emoji: "🔍" },
  { label: "Teamwork", emoji: "👥" },
  { label: "Helping Others", emoji: "🌟" }
];


export function StoryForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedYorkie, setSelectedYorkie] = useState<any>(null);

  useEffect(() => {
    const yorkieData = localStorage.getItem('selectedYorkie');
    if (!yorkieData) {
      setLocation('/select-yorkie');
      return;
    }
    setSelectedYorkie(JSON.parse(yorkieData));
  }, [setLocation]);

  const form = useForm<StoryFormData>({
    defaultValues: {
      characteristics: selectedYorkie?.analysis?.characterProfile?.personality || "",
      colors: "",
      theme: ""
    }
  });

  const onSubmit = async (data: StoryFormData) => {
    if (!selectedYorkie) {
      toast({
        title: "No Yorkie Selected",
        description: "Please select a Yorkie first.",
        variant: "destructive"
      });
      setLocation('/select-yorkie');
      return;
    }

    if (!data.characteristics || !data.colors || !data.theme) {
      toast({
        title: "Missing Information",
        description: "Please fill in all the fields to create your story.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("/api/stories/generate", {
        method: "POST",
        body: JSON.stringify({
          characteristics: data.characteristics,
          colors: data.colors,
          setting: "Uncle Mark's Farm",
          theme: data.theme,
          antagonist: "Evil Sorcerer",
          yorkieId: selectedYorkie.id
        })
      });

      localStorage.removeItem('selectedYorkie');
      setLocation(`/story/${response.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="characteristics"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yorkshire Terrier Characteristics</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Brave, Playful, Loyal" {...field} />
              </FormControl>
              <FormDescription>
                Select traits for your Yorkie character
              </FormDescription>
              <TagSelector
                tags={characteristics}
                onSelect={(trait) => {
                  const currentValue = field.value.trim();
                  const separator = currentValue ? ", " : "";
                  field.onChange(currentValue + separator + trait.toLowerCase());
                }}
              />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="colors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coat Colors</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Black and Tan" {...field} />
              </FormControl>
              <FormDescription>
                Choose your Yorkie's coat colors
              </FormDescription>
              <TagSelector
                tags={colors}
                onSelect={(color) => {
                  const currentValue = field.value.trim();
                  const separator = currentValue ? " and " : "";
                  field.onChange(currentValue + separator + color.toLowerCase());
                }}
              />
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
                <Input placeholder="e.g. Protecting the Farm" {...field} />
              </FormControl>
              <FormDescription>
                Choose the main theme for your story
              </FormDescription>
              <TagSelector
                tags={themes}
                onSelect={(theme) => field.onChange(theme)}
              />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Generating Your Story..." : "Generate Story"}
        </Button>
      </form>
    </Form>
  );
}