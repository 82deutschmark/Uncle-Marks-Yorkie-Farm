import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface StoryFormData {
  protagonist: string;
  setting: string;
  theme: string;
}

export function StoryForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<StoryFormData>({
    defaultValues: {
      protagonist: "",
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
          name="protagonist"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yorkshire Terrier Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Daisy, the adventurous Yorkie" {...field} />
              </FormControl>
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
                <Input placeholder="e.g. Enchanted Forest" {...field} />
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
                <Input placeholder="e.g. Friendship and Courage" {...field} />
              </FormControl>
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