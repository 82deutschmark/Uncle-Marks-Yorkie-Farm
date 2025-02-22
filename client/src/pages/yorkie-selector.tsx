import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Image } from "@shared/schema";
import { Loader2, Dog, RefreshCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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

  const { data: images, isLoading } = useQuery<Image[]>({
    queryKey: ['/api/images'],
    retry: false
  });

  const [selectedYorkie, setSelectedYorkie] = useState<YorkieSlot | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Get random images for selection
  const getDisplayImages = () => {
    if (!images) return [];
    return images
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
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
        title: "Character Selected!",
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

  const handleReroll = () => {
    setSelectedYorkie(null);
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
              {getDisplayImages().map((image) => (
                <Card 
                  key={image.id}
                  className={`relative ${
                    selectedYorkie?.id === image.id ? 'border-primary' : ''
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
                    {selectedYorkie?.id === image.id && image.analysis?.characterProfile && (
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
                      disabled={selectedYorkie?.id === image.id}
                      className="flex-1"
                    >
                      Select This Yorkie
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {selectedYorkie && (
              <div className="mt-8 space-y-4">
                {!showDetails && (
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={handleProceed}
                      className="text-xl py-6 px-12 transform hover:scale-105 transition-transform"
                    >
                      <Dog className="mr-3 h-6 w-6" />
                      Generate Story Now
                    </Button>
                  </div>
                )}

                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleReroll}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Choose Different Yorkie
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