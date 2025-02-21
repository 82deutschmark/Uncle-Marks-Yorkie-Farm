import { StoryForm } from "@/components/story-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">Animal Story Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <StoryForm />
        </CardContent>
      </Card>
    </div>
  );
}
