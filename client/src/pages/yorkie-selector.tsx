import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Image } from "@shared/schema";
import { Loader2, Dog, RefreshCcw } from "lucide-react";
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
  const [showDetails, setShowDetails] = useState(false);

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
        description: "Your new friend's personality has been revealed."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze the image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleProceed = () => {
    localStorage.setItem('selectedYorkie', JSON.stringify(selectedYorkie));
    setLocation('/create');
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
                          disabled={selectedYorkie?.id === image.id}
                          className="flex-1"
                        >
                          Select This Yorkie
                        </Button>
                        <Button 
                          variant="outline"
                          size="icon"
                          onClick={() => rerollSlot(slotIndex)}
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
                {!showDetails && (
                  <Button
                    size="lg"
                    onClick={handleProceed}
                    className="text-xl py-6 px-12 transform hover:scale-105 transition-transform"
                  >
                    <Dog className="mr-3 h-6 w-6" />
                    Generate Story Now
                  </Button>
                )}

                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={rerollAllSlots}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Show Different Yorkies
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowDetails(!showDetails)}
                    size="sm"
                  >
                    {showDetails ? "Hide Details" : "Add More Details"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}