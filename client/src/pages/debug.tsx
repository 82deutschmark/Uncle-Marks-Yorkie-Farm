import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import type { Image } from "@shared/schema";

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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for debug logs
  const { data: logs, isLoading: isLoadingLogs } = useQuery<DebugLogs>({
    queryKey: ["/api/debug/logs"],
    refetchInterval: 5000
  });

  // Query for images
  const { data: images, isLoading: isLoadingImages } = useQuery<Image[]>({
    queryKey: ["/api/images"],
    refetchInterval: 5000
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      return await apiRequest(`/api/images/${imageId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete image',
        variant: "destructive"
      });
    }
  });

  if (isLoadingLogs || isLoadingImages) {
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
      </div>

      {/* Database Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Database Records
            <Badge variant="outline">Images</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {images?.map((image) => (
                  <TableRow key={image.id}>
                    <TableCell>{image.id}</TableCell>
                    <TableCell>
                      <div className="h-16 w-16 relative">
                        <img
                          src={image.path.startsWith('/') ? image.path : `/${image.path}`}
                          alt={`Image ${image.id}`}
                          className="object-cover rounded-md"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{image.path}</TableCell>
                    <TableCell>{new Date(image.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {image.analyzed ? (
                        <Badge>Analyzed</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this image?')) {
                            deleteImageMutation.mutate(image.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!images || images.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No images found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Debug Logs */}
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
          disabled={isLoadingLogs || isLoadingImages}
        >
          Back to Review
        </Button>
        {/*This part is not changed*/}
      </div>
    </div>
  );
}