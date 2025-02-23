import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const personalities = [
  "Brave and Adventurous",
  "Sweet and Gentle",
  "Clever and Curious",
  "Playful and Energetic",
  "Loyal and Protective",
  "Mischievous and Fun",
  "Elegant and Graceful",
  "Determined and Strong"
];

export default function CharacterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPersonality, setSelectedPersonality] = useState<string>("");

  // Load any existing selection from localStorage
  useEffect(() => {
    const savedPersonality = localStorage.getItem("yorkiePersonality");
    if (savedPersonality) {
      setSelectedPersonality(savedPersonality);
    }
  }, []);

  const handleNext = () => {
    if (!selectedPersonality) {
      toast({
        title: "Select Personality",
        description: "Please select a personality for your Yorkie.",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem("yorkiePersonality", selectedPersonality);
    setLocation("/create/story");
  };

  const handleBack = () => {
    setLocation("/create/appearance");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="w-full">
          <Progress value={50} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">Step 2 of 4: Choose Your Yorkie's Personality</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Character Creation</CardTitle>
            <CardDescription>
              What kind of personality will your Yorkie hero have?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <h3 className="text-base font-semibold mb-2">Yorkie's Personality</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the personality that best fits your character
              </p>
              <RadioGroup
                value={selectedPersonality}
                onValueChange={setSelectedPersonality}
                className="grid grid-cols-2 gap-4"
              >
                {personalities.map((personality) => (
                  <div key={personality} className="relative">
                    <RadioGroupItem
                      value={personality}
                      id={personality}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={personality}
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      {personality}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-between mt-6">
              <Button
                onClick={handleBack}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleNext}
                size="lg"
                className="gap-2"
              >
                Next Step
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}