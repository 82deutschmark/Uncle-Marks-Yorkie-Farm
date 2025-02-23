import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

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

export default function DebugPage() {
  const { data: logs, isLoading } = useQuery<DebugLogs>({
    queryKey: ["/api/debug/logs"],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Debug Console</h1>

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
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}