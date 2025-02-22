import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileType, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
        body: formData,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadState(prev => ({
              ...prev,
              progress,
              status: `Uploading ${file.name}... ${progress}%`
            }));
          }
        }
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
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
    </div>
  );
}