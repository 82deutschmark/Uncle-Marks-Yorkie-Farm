import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2 } from "lucide-react";

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      // Set up completion handling
      xhr.onload = () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          setMessage({
            type: 'success',
            text: result.message
          });
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            throw new Error(error.message || 'Upload failed');
          } catch {
            throw new Error('Upload failed');
          }
        }
        setIsUploading(false);
      };

      // Set up error handling
      xhr.onerror = () => {
        setMessage({
          type: 'error',
          text: 'Network error occurred while uploading'
        });
        setIsUploading(false);
      };

      // Start upload
      xhr.open('POST', '/api/images/upload');
      xhr.send(formData);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to upload images'
      });
      setIsUploading(false);
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
          <CardTitle className="text-center">Upload Yorkshire Terrier Images</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center mb-6">
            Upload PNG images or ZIP files containing PNG images of Yorkshire terriers.
          </p>

          <div className="space-y-6">
            <div className="flex justify-center">
              <label
                htmlFor="file-upload"
                className={`cursor-pointer transition-opacity ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg hover:border-primary">
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {isUploading ? 'Uploading...' : 'Click to select file'}
                  </span>
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".png,.zip"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={isUploading}
                />
              </label>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {uploadProgress}% uploaded
                </p>
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