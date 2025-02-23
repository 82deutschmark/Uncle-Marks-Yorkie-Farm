import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

interface DebugLog {
  timestamp: string;
  service: "openai" | "midjourney";
  type: "request" | "response" | "error";
  content: any;
}

interface DebugLogs {
  openai: DebugLog[];
  midjourney: DebugLog[];
}

interface StoryResponse {
  id: number;
  title: string;
  content: string;
  metadata: {
    protagonist: {
      name: string;
      personality: string;
    };
    image_urls?: string[];
  };
}

export default function DebugPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Query for debug logs
  const { data: logs, isLoading } = useQuery<DebugLogs>({
    queryKey: ["/api/debug/logs"],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Story generation mutation
  const generateStoryMutation = useMutation({
    mutationFn: async (storyParams: any) => {
      return await apiRequest("/api/stories/generate", {
        method: "POST",
        body: JSON.stringify(storyParams)
      });
    },
    onSuccess: (data: StoryResponse) => {
      setIsGenerating(false);
      // Navigate to the story viewer
      setLocation(`/story/${data.id}`);
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({
        title: "Generation Error",
        description: "Failed to generate story. Please try again.",
        variant: "destructive"
      });
      console.error("Story generation error:", error);
    }
  });

  // Start story generation on mount if params exist
  useEffect(() => {
    const storyParams = localStorage.getItem("storyParams");
    if (storyParams && !isGenerating) {
      setIsGenerating(true);
      generateStoryMutation.mutate(JSON.parse(storyParams));
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Debug Console</h1>
        {isGenerating && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Generating Story...</span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* OpenAI Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              OpenAI Requests
              <Badge variant="outline">GPT-4</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              {logs?.openai?.map((log, index) => (
                <div key={index} className="mb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={log.type === "error" ? "destructive" : "default"}>
                      {log.type.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="bg-muted p-2 rounded-md overflow-x-auto">
                    <code>{JSON.stringify(log.content, null, 2)}</code>
                  </pre>
                </div>
              ))}
              {(!logs?.openai || logs.openai.length === 0) && (
                <div className="text-center text-muted-foreground">
                  No OpenAI logs yet
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* MidJourney Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              MidJourney Commands
              <Badge variant="outline">Discord</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              {logs?.midjourney?.map((log, index) => (
                <div key={index} className="mb-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={log.type === "error" ? "destructive" : "default"}>
                      {log.type.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="bg-muted p-2 rounded-md overflow-x-auto">
                    <code>{JSON.stringify(log.content, null, 2)}</code>
                  </pre>
                </div>
              ))}
              {(!logs?.midjourney || logs.midjourney.length === 0) && (
                <div className="text-center text-muted-foreground">
                  No MidJourney logs yet
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => setLocation("/create/review")}
          disabled={isGenerating}
        >
          Back to Review
        </Button>
        <Button
          onClick={() => {
            const storyParams = localStorage.getItem("storyParams");
            if (storyParams) {
              setIsGenerating(true);
              generateStoryMutation.mutate(JSON.parse(storyParams));
            } else {
              toast({
                title: "Error",
                description: "No story parameters found. Please go back and create a story.",
                variant: "destructive"
              });
            }
          }}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Retry Generation"
          )}
        </Button>
      </div>
    </div>
  );
}