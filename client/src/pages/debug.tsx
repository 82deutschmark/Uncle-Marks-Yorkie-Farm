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

// Helper function to handle image paths
const getImagePath = (imagePath: string) => {
  if (!imagePath) return '';
  // Try multiple path formats if needed
  const paths = [
    imagePath,
    imagePath.startsWith('/') ? imagePath : `/uploads/${imagePath}`,
    imagePath.startsWith('/uploads/') ? imagePath.substring(8) : imagePath
  ];
  return paths.find(path => path) || ''; // Return the first defined path or empty string
};

// Image component with error handling
const ImageWithFallback = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [pathIndex, setPathIndex] = useState(0);
  const paths = [
    src,
    src.startsWith('/') ? src : `/uploads/${src}`,
    src.startsWith('/uploads/') ? src.substring(8) : src
  ];

  const handleError = () => {
    if (pathIndex < paths.length - 1) {
      setPathIndex(pathIndex + 1);
    }
  };

  return (
    <img
      src={paths[pathIndex]}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};


export default function DebugPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Query for debug logs with reduced refresh rate
  const { data: logs, isLoading: isLoadingLogs } = useQuery<DebugLogs>({
    queryKey: ["/api/debug/logs"],
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  // Query for images with reduced refresh rate and sorting
  const { data: images, isLoading: isLoadingImages } = useQuery<Image[]>({
    queryKey: ["/api/images", sortBy, sortOrder],
    queryFn: () => apiRequest(`/api/images?sortBy=${sortBy}&sortOrder=${sortOrder}`, { method: 'GET'}),
    refetchInterval: 300000 // Refresh every 5 minutes
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
      queryClient.invalidateQueries({ queryKey: ["/api/images", sortBy, sortOrder] });
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
        <div>
          <label htmlFor="sortBy" className="mr-2">Sort By:</label>
          <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="createdAt">Created At</option>
            <option value="path">Path</option>
            {/* Add more options as needed */}
          </select>
          <label htmlFor="sortOrder" className="mx-2">Order:</label>
          <select id="sortOrder" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
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
          <div className="relative w-full overflow-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">ID / Actions</TableHead>
                  <TableHead className="w-[100px]">Preview</TableHead>
                  <TableHead className="min-w-[200px]">Path</TableHead>
                  <TableHead className="w-[200px]">Created At</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {images?.map((image) => (
                  <TableRow key={image.id}>
                    <TableCell className="flex items-center gap-2">
                      <span>{image.id}</span>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this image?')) {
                            deleteImageMutation.mutate(image.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="h-16 w-16 relative">
                        <ImageWithFallback
                          src={getImagePath(image.path)}
                          alt={`Image ${image.id}`}
                          className="object-cover rounded-md"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm truncate max-w-[300px]">{image.path}</TableCell>
                    <TableCell>{new Date(image.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {image.analyzed ? (
                        <Badge>Analyzed</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!images || images.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No images found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
          onClick={() => setLocation("/")}
          disabled={isLoadingLogs || isLoadingImages}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}