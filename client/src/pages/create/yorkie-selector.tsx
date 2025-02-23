import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function YorkieSelector() {
  const [, setLocation] = useLocation();

  const handleStartStory = () => {
    setLocation('/details');
  };

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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}