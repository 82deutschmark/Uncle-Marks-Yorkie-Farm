import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Image } from "@shared/schema";
import { Loader2, Dog, RefreshCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface YorkieSlot {
  id: number;
  position: 1 | 2 | 3;
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

  const { data: images, isLoading } = useQuery<Image[]>({
    queryKey: ['/api/images'],
    retry: false
  });

  const [selectedYorkies, setSelectedYorkies] = useState<YorkieSlot[]>([]);
  const [activeSlot, setActiveSlot] = useState<1 | 2 | 3>(1);

  // Get filtered images for the current slot
  const getSlotImages = (slotNumber: number) => {
    if (!images) return [];

    // For first two slots, prefer images with matching metadata if available
    if (slotNumber <= 2) {
      const analyzed = images.filter(img => img.analyzed && img.analysis?.characterProfile);
      if (analyzed.length >= 3) {
        return analyzed.slice(0, 3);
      }
    }

    // Otherwise or for third slot, return random images
    return images
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  };

  const handleDescribe = async (image: Image) => {
    try {
      const response = await apiRequest(`/api/images/${image.id}/analyze`, {
        method: 'POST'
      });

      setSelectedYorkies(prev => [
        ...prev.filter(y => y.position !== activeSlot),
        { 
          id: image.id, 
          position: activeSlot,
          description: response.analysis?.description,
          characterProfile: response.analysis?.characterProfile
        }
      ]);

      toast({
        title: "Character Described!",
        description: "Your Yorkie's personality has been revealed."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze the image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReroll = (slotNumber: number) => {
    setSelectedYorkies(prev => prev.filter(y => y.position !== slotNumber));
  };

  const canProceed = selectedYorkies.length === 3 && 
    selectedYorkies.every(yorkie => yorkie.description && yorkie.characterProfile);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleProceed = () => {
    localStorage.setItem('selectedYorkies', JSON.stringify(selectedYorkies));
    setLocation('/create');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-serif">Choose Your Yorkies</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeSlot.toString()} onValueChange={(v) => setActiveSlot(Number(v) as 1 | 2 | 3)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="1">
                  Yorkie One {selectedYorkies.find(y => y.position === 1) && '✓'}
                </TabsTrigger>
                <TabsTrigger value="2">
                  Yorkie Two {selectedYorkies.find(y => y.position === 2) && '✓'}
                </TabsTrigger>
                <TabsTrigger value="3">
                  Yorkie Three {selectedYorkies.find(y => y.position === 3) && '✓'}
                </TabsTrigger>
              </TabsList>

              {[1, 2, 3].map((slot) => (
                <TabsContent key={slot} value={slot.toString()}>
                  <div className="grid gap-6 md:grid-cols-3">
                    {getSlotImages(slot).map((image) => (
                      <Card 
                        key={image.id}
                        className={`relative ${
                          selectedYorkies.find(y => y.position === slot)?.id === image.id
                            ? 'border-primary'
                            : ''
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
                          {image.analysis?.characterProfile && (
                            <div className="space-y-2">
                              <h3 className="font-semibold">
                                {image.analysis.characterProfile.name || 'Friendly Yorkie'}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {image.analysis.characterProfile.personality || 'A lovable Yorkshire Terrier ready for adventures!'}
                              </p>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="flex gap-2">
                          <Button
                            onClick={() => handleDescribe(image)}
                            disabled={selectedYorkies.find(y => y.position === slot)?.id === image.id}
                            className="flex-1"
                          >
                            Describe
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleReroll(slot)}
                      className="flex items-center gap-2"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Reroll Options
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              size="lg"
              disabled={!canProceed}
              onClick={handleProceed}
              className="mt-4"
            >
              <Dog className="mr-2 h-4 w-4" />
              Start Creating Story
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}