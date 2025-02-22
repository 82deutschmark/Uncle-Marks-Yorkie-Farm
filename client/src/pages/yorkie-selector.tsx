import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Image } from "@shared/schema";
import { Loader2, Dog, RefreshCcw, AlertTriangle } from "lucide-react";
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
  const [isGenerating, setIsGenerating] = useState(false);
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

  const handleDescribe = async (image: Image) => {
    setAnalyzingId(image.id);
    toast({
      title: "Analyzing Yorkie",
      description: "Getting to know your new friend's personality...",
    });

    try {
      const response = await apiRequest(`/api/images/${image.id}/analyze`, {
        method: 'POST'
      });

      setSelectedYorkie({ 
        id: image.id,
        description: response.analysis?.description,
        characterProfile: response.analysis?.characterProfile
      });

      toast({
        title: "Yorkie Selected!",
        description: response.analysis?.characterProfile?.name 
          ? `Meet ${response.analysis.characterProfile.name}!` 
          : "Your new friend's personality has been revealed."
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      const isRetryable = error.response?.data?.retry || false;

      toast({
        title: "Analysis Error",
        description: errorMessage,
        variant: "destructive",
        action: isRetryable ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleDescribe(image)}
          >
            Retry
          </Button>
        ) : undefined
      });

      setSelectedYorkie(null);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleGenerateStory = async () => {
    if (!selectedYorkie?.characterProfile) {
      toast({
        title: "Error",
        description: "Please select a Yorkie first.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    toast({
      title: "Creating Your Story",
      description: "Crafting a magical adventure..."
    });

    try {
      const response = await apiRequest("/api/stories/generate", {
        method: "POST",
        body: JSON.stringify({
          characteristics: selectedYorkie.characterProfile.personality || "friendly",
          colors: "brown and black",
          setting: "Uncle Mark's Magical Farm",
          theme: "Adventure",
          antagonist: "Mischievous Squirrel",
          yorkieId: selectedYorkie.id
        })
      });

      localStorage.removeItem('selectedYorkie');
      setLocation(`/story/${response.id}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      const isRetryable = error.response?.data?.retry || false;

      toast({
        title: "Story Generation Error",
        description: (
          <div className="flex flex-col gap-2">
            <span>{errorMessage}</span>
            {isRetryable && (
              <span className="text-sm text-muted-foreground">
                This is a temporary error. Please try again.
              </span>
            )}
          </div>
        ),
        variant: "destructive",
        action: isRetryable ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateStory}
          >
            Retry
          </Button>
        ) : undefined
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddDetails = () => {
    if (selectedYorkie) {
      localStorage.setItem('selectedYorkie', JSON.stringify(selectedYorkie));
      setLocation('/details');
    }
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
            <CardTitle className="text-center text-2xl font-serif">Choose Your Yorkie Friend</CardTitle>
          </CardHeader>
          <CardContent>
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
                          {analyzingId === image.id && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                              <div className="text-center space-y-2">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                <p className="text-sm">Analyzing personality...</p>
                              </div>
                            </div>
                          )}
                        </div>
                        {selectedYorkie?.id === image.id && selectedYorkie.characterProfile && (
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">
                              {selectedYorkie.characterProfile.name || 'Friendly Yorkie'}
                            </h3>
                            <p className="text-muted-foreground">
                              {selectedYorkie.characterProfile.personality || 'A lovable Yorkshire Terrier ready for adventures!'}
                            </p>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button
                          onClick={() => handleDescribe(image)}
                          disabled={analyzingId !== null || selectedYorkie?.id === image.id}
                          className="flex-1"
                        >
                          {analyzingId === image.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            "Select This Yorkie"
                          )}
                        </Button>
                        <Button 
                          variant="outline"
                          size="icon"
                          onClick={() => rerollSlot(slotIndex)}
                          disabled={analyzingId !== null}
                        >
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ))}
            </div>

            {selectedYorkie && (
              <div className="mt-8 space-y-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Button
                    size="lg"
                    onClick={handleGenerateStory}
                    disabled={isGenerating || analyzingId !== null}
                    className="text-xl py-6 px-12 transform hover:scale-105 transition-transform"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Creating Your Story...
                      </>
                    ) : (
                      <>
                        <Dog className="mr-3 h-6 w-6" />
                        Generate Quick Story
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleAddDetails}
                    size="lg"
                    disabled={isGenerating || analyzingId !== null}
                    className="text-lg"
                  >
                    Customize Story Details
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={rerollAllSlots}
                  size="sm"
                  disabled={isGenerating || analyzingId !== null}
                  className="flex items-center gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Show Different Yorkies
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}