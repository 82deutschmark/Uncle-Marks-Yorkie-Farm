import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Image } from "@shared/schema";
import { Loader2, Dog } from "lucide-react";

export default function YorkieSelector() {
  const [, setLocation] = useLocation();
  
  const { data: images, isLoading } = useQuery<Image[]>({
    queryKey: ['/api/images'],
    retry: false
  });

  const handleYorkieSelect = (image: Image) => {
    // Store the selected Yorkie's info and proceed to story creation
    localStorage.setItem('selectedYorkie', JSON.stringify({
      id: image.id,
      analysis: image.analysis
    }));
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
            <CardTitle className="text-center text-2xl font-serif">Choose Your Yorkie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {images?.map((image) => (
                <Card 
                  key={image.id} 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleYorkieSelect(image)}
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
                        <h3 className="font-semibold">{image.analysis.characterProfile.name || 'Friendly Yorkie'}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {image.analysis.characterProfile.personality || 'A lovable Yorkshire Terrier ready for adventures!'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {(!images || images.length === 0) && (
                <div className="col-span-full text-center py-8">
                  <Dog className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No Yorkies available. Please upload some images first!</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setLocation('/upload')}
                  >
                    Upload Images
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
