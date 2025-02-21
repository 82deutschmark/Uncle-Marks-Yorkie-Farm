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
  antagonist: string;
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
  { label: "Uncle Mark's Magical Farm", emoji: "🏡" },
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

const antagonists = [
  { label: "Mischievous Squirrel", emoji: "🐿️" },
  { label: "Sneaky Mouse", emoji: "🐁" },
  { label: "Crafty Rat", emoji: "🐀" },
  { label: "Pesky Chipmunk", emoji: "🦫" },
  { label: "Troublesome Gopher", emoji: "🦫" }
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
      theme: "",
      antagonist: ""
    }
  });

  const onSubmit = async (data: StoryFormData) => {
    if (!data.characteristics || !data.colors || !data.setting || !data.theme || !data.antagonist) {
      toast({
        title: "Missing Information",
        description: "Please fill in all the fields to find matching Yorkie characters.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/images", {
        params: {
          processed: true,
          characteristics: data.characteristics,
          colors: data.colors
        }
      });
      const images = await response.json();
      setLocation(`/character-selection?${new URLSearchParams(data as any).toString()}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to find matching Yorkie characters. Please try again.",
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
                Select the characteristics to match with our Yorkie characters
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
                Choose coat colors to match with our Yorkie characters
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
                <Input placeholder="e.g. Uncle Mark's Magical Farm" {...field} />
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
          name="antagonist"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Story Antagonist</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Mischievous Squirrel" {...field} />
              </FormControl>
              <FormDescription>
                Select a troublesome rodent as your story's antagonist
              </FormDescription>
              <TagSelector
                tags={antagonists}
                onSelect={(antagonist) => field.onChange(antagonist)}
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
          {isLoading ? "Finding Characters..." : "Find Yorkie Characters for My Story"}
        </Button>
      </form>
    </Form>
  );
}