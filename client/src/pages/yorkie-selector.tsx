import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Image } from "@shared/schema";
import { Dog, RefreshCcw, Sparkles, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface YorkieSlot {
  id: number;
  description?: string;
  characterProfile?: {
    name?: string;
    personality?: string;
    description?: string;
  };
}

export default function YorkieSelector() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [displayImages, setDisplayImages] = useState<Image[][]>([[], [], []]);
  const [selectedYorkie, setSelectedYorkie] = useState<YorkieSlot | null>(null);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  const { data: images, isLoading } = useQuery<Image[]>({
    queryKey: ['/api/images'],
    retry: false
  });

  useEffect(() => {
    if (images) {
      rerollAllSlots();
    }
  }, [images]);

  const rerollSlot = (slotIndex: number) => {
    if (!images) return;

    const newImages = [...displayImages];
    newImages[slotIndex] = images
      .filter(img => !displayImages.flat().some(di => di.id === img.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 1);

    setDisplayImages(newImages);
  };

  const rerollAllSlots = () => {
    if (!images) return;
    const shuffled = [...images].sort(() => Math.random() - 0.5);
    setDisplayImages([
      shuffled.slice(0, 1),
      shuffled.slice(1, 2),
      shuffled.slice(2, 3)
    ]);
  };

  const handleStartStory = () => {
    setLocation('/details');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-serif">Begin Your Yorkie Adventure</CardTitle>
            <CardDescription className="text-center text-lg">
              Let's create a magical story about a Yorkshire Terrier at Uncle Mark's Farm
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Primary Action - Story Creation */}
            <div className="mb-8 text-center space-y-6">
              <div className="space-y-3">
                <Button
                  size="lg"
                  onClick={handleStartStory}
                  className="text-xl py-8 px-16 transform hover:scale-105 transition-transform"
                >
                  <Sparkles className="mr-3 h-6 w-6" />
                  Create Your Story
                </Button>
                <p className="text-muted-foreground">
                  Customize your story's characters and settings
                </p>
              </div>
            </div>

            {/* Optional - Character Gallery */}
            <div className="mt-12 pt-6 border-t border-border opacity-70 hover:opacity-100 transition-opacity">
              <div className="text-center mb-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Optional: Browse Our Character Gallery
                </h3>
                <p className="text-xs text-muted-foreground">
                  View some of our AI-generated Yorkshire Terriers
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {displayImages.map((slotImages, slotIndex) => (
                  <div key={slotIndex} className="space-y-4">
                    {slotImages.map((image) => (
                      <Card
                        key={image.id}
                        className={`relative ${
                          selectedYorkie?.id === image.id ? 'border-primary border-2' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="aspect-square mb-4 relative overflow-hidden rounded-lg">
                            <img
                              src={`/uploads/${image.path}`}
                              alt="Yorkshire Terrier"
                              className="object-cover w-full h-full"
                            />
                          </div>
                          {selectedYorkie?.id === image.id && selectedYorkie.characterProfile && (
                            <div className="space-y-2">
                              <h3 className="font-semibold text-lg">
                                {selectedYorkie.characterProfile.name || 'Friendly Yorkie'}
                              </h3>
                              <p className="text-muted-foreground text-sm">
                                {selectedYorkie.characterProfile.personality || 'A lovable Yorkshire Terrier ready for adventures!'}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-center">
                <Button
                  variant="ghost"
                  onClick={rerollAllSlots}
                  size="sm"
                  disabled={analyzingId !== null}
                  className="text-muted-foreground"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Show Different Characters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}