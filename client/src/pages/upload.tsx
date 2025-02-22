import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileType, Loader2, Image as ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Image } from "@shared/schema";

export default function UploadPage() {
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
  const { data: images, isLoading: isLoadingImages } = useQuery<Image[]>({
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

      setMessage({
        type: 'success',
        text: `Successfully processed ${result.images.length} image${result.images.length === 1 ? '' : 's'} from ${file.name}`
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">File Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-center">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer w-full"
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

              {uploadState.isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadState.progress} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    {uploadState.status}
                  </div>
                  {uploadState.processedFiles > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Processed {uploadState.processedFiles} file{uploadState.processedFiles === 1 ? '' : 's'}
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
            </div>
          </CardContent>
        </Card>

        {/* Existing Images Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl font-serif">Existing Images</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingImages ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : images && images.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted"
                    >
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{image.path.split('/').pop()}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded: {new Date(image.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {image.analyzed && (
                        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Analyzed
                        </div>
                      )}
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