import { useState } from "react";
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
  setting: string;
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

const settings = [
  { label: "Enchanted Garden", emoji: "🌸" },
  { label: "Cozy Home", emoji: "🏠" },
  { label: "City Park", emoji: "🌳" },
  { label: "Beach", emoji: "🏖️" },
  { label: "Forest Trail", emoji: "🌲" },
  { label: "Dog Park", emoji: "🐕" }
];

const themes = [
  { label: "Friendship", emoji: "🤝" },
  { label: "Courage", emoji: "💪" },
  { label: "Discovery", emoji: "🔍" },
  { label: "Family", emoji: "👨‍👩‍👧‍👦" },
  { label: "Helping Others", emoji: "🌟" },
  { label: "Adventure", emoji: "🎯" }
];

export function StoryForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<StoryFormData>({
    defaultValues: {
      characteristics: "",
      colors: "",
      setting: "",
      theme: ""
    }
  });

  const onSubmit = async (data: StoryFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/stories/generate", data);
      const story = await response.json();
      setLocation(`/story/${story.id}`);
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
                Select the characteristics for your Yorkie protagonist
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
              <FormLabel>Favorite Colors</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Black and Tan" {...field} />
              </FormControl>
              <FormDescription>
                Choose your preferred Yorkie coat colors
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
          name="setting"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Story Setting</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Enchanted Garden" {...field} />
              </FormControl>
              <FormDescription>
                Choose a magical place for your Yorkie's adventure
              </FormDescription>
              <TagSelector
                tags={settings}
                onSelect={(setting) => field.onChange(setting)}
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
                <Input placeholder="e.g. Friendship and Courage" {...field} />
              </FormControl>
              <FormDescription>
                Pick themes that will shape your Yorkie's journey
              </FormDescription>
              <TagSelector
                tags={themes}
                onSelect={(theme) => {
                  const currentValue = field.value.trim();
                  const separator = currentValue ? " and " : "";
                  field.onChange(currentValue + separator + theme.toLowerCase());
                }}
              />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Generating Story..." : "Generate Story"}
        </Button>
      </form>
    </Form>
  );
}