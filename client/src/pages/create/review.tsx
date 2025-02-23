import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Code2 } from "lucide-react";
import type { StoryDetails } from "@shared/schema";
import { RefreshCw } from "lucide-react";


interface YorkieOption {
  id: string;
  url: string;
}

export default function ReviewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [developerMode, setDeveloperMode] = useState(false);
  const [images, setImages] = useState<YorkieOption[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [storyDetails, setStoryDetails] = useState<StoryDetails>({
    colors: [],
    personality: '',
    theme: '',
    antagonist: '',
    farmElements: [],
    artStyles: []
  });

  useEffect(() => {
    // Load saved details from localStorage
    try {
      const savedDetails: StoryDetails = {
        colors: JSON.parse(localStorage.getItem("yorkieColors") || "[]"),
        personality: localStorage.getItem("yorkiePersonality") || "",
        theme: localStorage.getItem("yorkieTheme") || "",
        antagonist: localStorage.getItem("yorkieAntagonist") || "",
        farmElements: JSON.parse(localStorage.getItem("yorkieFarmElements") || "[]"),
        artStyles: JSON.parse(localStorage.getItem("yorkieArtStyles") || "[]")
      };
      setStoryDetails(savedDetails);
    } catch (error) {
      console.error('Error loading story details:', error);
      toast({
        title: "Error",
        description: "Failed to load story details. Please try again.",
        variant: "destructive"
      });
    }
  }, []);

  const fetchRandomImages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/images/random');
      const data = await response.json();
      setImages(data.images);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Yorkie images. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomImages();
  }, []);

  const handleSelectYorkie = (imageId: string) => {
    setSelectedImageId(imageId);
    localStorage.setItem('selectedYorkieId', imageId);
  };

  const handleGenerateStory = () => {
    if (!selectedImageId) {
      toast({
        title: 'Select a Yorkie',
        description: 'Please select a Yorkie friend first!',
        variant: 'destructive'
      });
      return;
    }
    setLocation('/story');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="w-full">
          <Progress value={100} />
          <p className="text-sm text-muted-foreground mt-1">Story Control Center</p>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">Story Details</h1>
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            <span className="text-sm">Dev Mode</span>
            <Switch checked={developerMode} onCheckedChange={setDeveloperMode} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="col-span-1">
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Story Elements</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Colors:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {storyDetails.colors.map(color => (
                        <Badge key={color} variant="outline">{color}</Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium">Personality:</span>
                    <p className="text-sm">{storyDetails.personality}</p>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium">Theme:</span>
                    <p className="text-sm">{storyDetails.theme}</p>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium">Farm Elements:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {storyDetails.farmElements.map(element => (
                        <Badge key={element} variant="outline">{element}</Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium">Art Styles:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {storyDetails.artStyles.map(style => (
                        <Badge key={style} variant="outline">{style}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-semibold tracking-tight text-center text-2xl font-serif">
                Choose Your Yorkie Friend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {images.map((image) => (
                  <div key={image.id} className="space-y-4">
                    <div 
                      className={`rounded-lg bg-card text-card-foreground shadow-sm relative border-2 ${
                        selectedImageId === image.id ? 'border-primary' : 'border-muted'
                      }`}
                    >
                      <div className="p-4">
                        <div className="aspect-square mb-4 relative overflow-hidden rounded-lg">
                          <img 
                            src={image.url} 
                            alt="Yorkshire Terrier"
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="items-center p-6 pt-0 flex gap-2">
                          <Button 
                            className="flex-1"
                            onClick={() => handleSelectYorkie(image.id)}
                            disabled={isLoading}
                          >
                            Select This Yorkie
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchRandomImages}
                            disabled={isLoading}
                          >
                            <RefreshCw className="h-4 w-4"/>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 space-y-6 text-center">
          <Button
            size="lg"
            onClick={handleGenerateStory}
            disabled={!selectedImageId || isLoading}
          >
            Generate Story
          </Button>
        </div>
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => setLocation("/create/art-style")}>
            Back
          </Button>
          {/*Removed Generate Story Button as it's now handled by the new component */}
        </div>
      </div>
    </div>
  );
}