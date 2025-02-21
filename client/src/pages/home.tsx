import { StoryForm } from "@/components/story-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">Create Your Yorkshire Terrier Story</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center mb-6">
            Start by selecting traits to find the perfect Yorkie characters for your story
          </p>
          <StoryForm />
        </CardContent>
      </Card>
    </div>
  );
}