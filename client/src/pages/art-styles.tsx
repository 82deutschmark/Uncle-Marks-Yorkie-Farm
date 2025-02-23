import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { insertCustomArtStyleSchema } from "@shared/schema";
import { Loader2, Plus, Pencil } from "lucide-react";
import type { CustomArtStyle } from "@shared/schema";
import type { z } from "zod";

type FormData = z.infer<typeof insertCustomArtStyleSchema>;

export default function ArtStyles() {
  const { toast } = useToast();
  const [editingStyle, setEditingStyle] = useState<CustomArtStyle | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(insertCustomArtStyleSchema),
    defaultValues: {
      name: "",
      description: "",
      examplePrompt: ""
    }
  });

  // Query to fetch existing custom art styles
  const { data: styles, isLoading } = useQuery<CustomArtStyle[]>({
    queryKey: ['/api/art-styles'],
    queryFn: async () => {
      const response = await apiRequest("/api/art-styles");
      return response as CustomArtStyle[];
    }
  });

  // Mutation to create/update custom art style
  const mutation = useMutation<CustomArtStyle, Error, FormData>({
    mutationFn: async (data) => {
      if (editingStyle) {
        return await apiRequest(`/api/art-styles/${editingStyle.id}`, {
          method: "PATCH",
          body: JSON.stringify(data)
        });
      } else {
        return await apiRequest("/api/art-styles", {
          method: "POST",
          body: JSON.stringify(data)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/art-styles'] });
      form.reset();
      setEditingStyle(null);
      toast({
        title: "Success",
        description: editingStyle 
          ? "Art style updated successfully" 
          : "New art style created successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to save art style. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const handleEdit = (style: CustomArtStyle) => {
    setEditingStyle(style);
    form.reset({
      name: style.name,
      description: style.description,
      examplePrompt: style.examplePrompt || ""
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{editingStyle ? "Edit Art Style" : "Create New Art Style"}</CardTitle>
            <CardDescription>
              Define custom art styles for your stories' illustrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Watercolor Fantasy" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the unique characteristics of this art style..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="examplePrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Example Prompt</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide an example MidJourney prompt that demonstrates this style..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This will help generate consistent illustrations in your chosen style
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="w-full"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      {editingStyle ? "Update Style" : "Add Style"}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* List of existing styles */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Your Custom Styles</h2>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : styles?.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No custom styles created yet. Add your first style above!
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {styles?.map((style) => (
                <Card key={style.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{style.name}</h3>
                        <p className="text-sm text-muted-foreground">{style.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(style)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                    {style.examplePrompt && (
                      <div className="bg-muted p-3 rounded-md text-sm">
                        <p className="font-mono">{style.examplePrompt}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}