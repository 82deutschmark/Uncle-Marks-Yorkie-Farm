import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const themes = [
  { value: "farm-adventure", label: "Farm Adventure", description: "Explore Uncle Mark's Farm" },
  { value: "friendship", label: "Making Friends", description: "Meeting new animal friends" },
  { value: "helping", label: "Helping Others", description: "Being kind and helpful" },
  { value: "mystery", label: "Solving Mysteries", description: "Finding clues and solving puzzles" },
  { value: "learning", label: "Learning New Things", description: "Discovering the world" },
  { value: "courage", label: "Finding Courage", description: "Overcoming fears" }
];

const antagonists = [
  {
    value: "sorcerer-basic",
    label: "Evil Sorcerer",
    description: "A mysterious dark wizard who wants to steal the farm's magic"
  },
  {
    value: "sorcerer-squirrels",
    label: "Sorcerer & Squirrel Army",
    description: "Evil wizard commanding an army of mischievous squirrels"
  },
  {
    value: "squirrel-gang",
    label: "The Nutty Gang",
    description: "Organized squirrels trying to steal eggs and crops"
  },
  {
    value: "dark-wizard",
    label: "Dark Wizard & Shadow Creatures",
    description: "Powerful wizard with shadow creatures threatening the farm"
  }
];

const farmElements = [
  {
    value: "chickens",
    label: "Chicken Coop",
    description: "Protect the special golden eggs"
  },
  {
    value: "turkeys",
    label: "Turkey Squad",
    description: "The farm's watchful guardians"
  },
  {
    value: "garden",
    label: "Magic Garden",
    description: "Enchanted vegetables and fruits"
  },
  {
    value: "barn",
    label: "Ancient Barn",
    description: "Full of magical farm secrets"
  }
];

export default function StoryPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState("");
  const [selectedAntagonist, setSelectedAntagonist] = useState("");
  const [selectedElements, setSelectedElements] = useState<string[]>([]);

  // Load existing selections from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("yorkieTheme");
    const savedAntagonist = localStorage.getItem("yorkieAntagonist");
    const savedElements = localStorage.getItem("yorkieElements");

    if (savedTheme) setSelectedTheme(savedTheme);
    if (savedAntagonist) setSelectedAntagonist(savedAntagonist);
    if (savedElements) setSelectedElements(JSON.parse(savedElements));
  }, []);

  const handleElementToggle = (element: string) => {
    setSelectedElements(prev => {
      if (prev.includes(element)) {
        return prev.filter(e => e !== element);
      }
      return [...prev, element];
    });
  };

  const handleNext = () => {
    if (!selectedTheme || !selectedAntagonist || selectedElements.length === 0) {
      toast({
        title: "Missing Selections",
        description: "Please select a theme, antagonist, and at least one farm element.",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem("yorkieTheme", selectedTheme);
    localStorage.setItem("yorkieAntagonist", selectedAntagonist);
    localStorage.setItem("yorkieElements", JSON.stringify(selectedElements));
    setLocation("/create/art-style");
  };

  const handleBack = () => {
    setLocation("/create/character");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="w-full">
          <Progress value={75} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">Step 3 of 4: Design Your Story</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Story Elements</CardTitle>
            <CardDescription>
              Shape your Yorkie's magical adventure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Theme Selection */}
            <div>
              <h3 className="text-base font-semibold mb-2">Story Theme</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the main theme for your story
              </p>
              <RadioGroup
                value={selectedTheme}
                onValueChange={setSelectedTheme}
                className="grid grid-cols-2 gap-4"
              >
                {themes.map((theme) => (
                  <div key={theme.value} className="relative">
                    <RadioGroupItem
                      value={theme.value}
                      id={theme.value}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={theme.value}
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span className="font-semibold">{theme.label}</span>
                      <span className="text-sm text-muted-foreground text-center mt-1">
                        {theme.description}
                      </span>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Antagonist Selection */}
            <div>
              <h3 className="text-base font-semibold mb-2">Story Villain</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose who your Yorkie will face off against
              </p>
              <RadioGroup
                value={selectedAntagonist}
                onValueChange={setSelectedAntagonist}
                className="grid grid-cols-2 gap-4"
              >
                {antagonists.map((antagonist) => (
                  <div key={antagonist.value} className="relative">
                    <RadioGroupItem
                      value={antagonist.value}
                      id={antagonist.value}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={antagonist.value}
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                    >
                      <span className="font-semibold">{antagonist.label}</span>
                      <span className="text-sm text-muted-foreground text-center mt-1">
                        {antagonist.description}
                      </span>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Farm Elements Selection */}
            <div>
              <h3 className="text-base font-semibold mb-2">Farm Elements</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select the magical farm elements in your story
              </p>
              <div className="grid grid-cols-2 gap-4">
                {farmElements.map((element) => (
                  <div
                    key={element.value}
                    className={`cursor-pointer rounded-md border-2 p-4 hover:bg-accent hover:text-accent-foreground ${
                      selectedElements.includes(element.value)
                        ? "border-primary bg-primary/5"
                        : "border-muted"
                    }`}
                    onClick={() => handleElementToggle(element.value)}
                  >
                    <div className="font-semibold">{element.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {element.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
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