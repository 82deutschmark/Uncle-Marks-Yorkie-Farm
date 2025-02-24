import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileType, Loader2, Image as ImageIcon, Archive } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Image } from "@shared/schema";
import {Badge} from "@/components/ui/badge";

export default function UploadPage() {
  const { toast } = useToast();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [uploadState, setUploadState] = useState<{
    isUploading: boolean;
    progress: number;
    currentFile: string;
    processedFiles: number;
    totalFiles: number;
    status: string;
  }>({
    isUploading: false,
    progress: 0,
    currentFile: '',
    processedFiles: 0,
    totalFiles: 0,
    status: ''
  });

  // Fetch existing images
  const { data: images, isLoading: isLoadingImages, refetch: refetchImages } = useQuery<Image[]>({
    queryKey: ['/api/images'],
    retry: false
  });

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadState({
        isUploading: true,
        progress: 0,
        currentFile: file.name,
        processedFiles: 0,
        totalFiles: 1,
        status: 'Starting upload...'
      });

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        processedFiles: result.images.length,
        status: 'Upload complete!'
      }));

      await refetchImages();

      setMessage({
        type: 'success',
        text: `Successfully processed ${result.images.length} image${result.images.length === 1 ? '' : 's'}`
      });
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        status: 'Upload failed'
      }));

      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to upload file'
      });
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Process stored ZIP files
  const processZipMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/process-zip', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to process ZIP file');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      await refetchImages();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process ZIP file',
        variant: "destructive"
      });
    }
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Image Upload</CardTitle>
            <CardDescription>
              Upload individual images or process stored ZIP files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Individual File Upload */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Upload Individual Images</h3>
              <label
                htmlFor="file-upload"
                className="cursor-pointer block w-full"
              >
                <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg hover:border-primary">
                  {uploadState.isUploading ? (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {uploadState.isUploading
                      ? uploadState.status
                      : "Click to select a file to upload"}
                  </span>
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploadState.isUploading}
                />
              </label>
            </div>

            {/* Process ZIP Files */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Process Stored ZIP Files</h3>
              <Button
                onClick={() => processZipMutation.mutate()}
                disabled={processZipMutation.isPending}
                className="w-full h-24 gap-4"
                variant="outline"
              >
                {processZipMutation.isPending ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Processing ZIP files...</span>
                  </>
                ) : (
                  <>
                    <Archive className="h-6 w-6" />
                    <span>Process ZIP Files from Assets</span>
                  </>
                )}
              </Button>
            </div>

            {uploadState.isUploading && (
              <div className="space-y-2">
                <Progress value={uploadState.progress} className="w-full" />
                <div className="text-sm text-muted-foreground">
                  {uploadState.status}
                </div>
                {uploadState.processedFiles > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Processed {uploadState.processedFiles} of {uploadState.totalFiles} files
                  </div>
                )}
              </div>
            )}

            {message && (
              <Alert variant={message.type === 'error' ? "destructive" : "default"}>
                <AlertDescription>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Existing Images */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-serif">Uploaded Images</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingImages ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : images && images.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="relative group aspect-square rounded-lg overflow-hidden border"
                    >
                      <img
                        src={image.path}
                        alt={`Image ${image.id}`}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <div className="text-white text-sm">
                          <p className="font-medium truncate">ID: {image.id}</p>
                          <p className="text-xs opacity-75">
                            {new Date(image.createdAt).toLocaleDateString()}
                          </p>
                          {image.analyzed && (
                            <Badge variant="default" className="mt-2">
                              Analyzed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center text-muted-foreground p-4">
                No images uploaded yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}