import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload } from "lucide-react";

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB in bytes

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size before uploading
    if (file.size > MAX_FILE_SIZE) {
      setMessage({
        type: 'error',
        text: `File is too large. Maximum size is 200MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB`
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          setMessage({
            type: 'success',
            text: result.message
          });
        } else {
          const error = JSON.parse(xhr.responseText);
          throw new Error(error.message || 'Upload failed');
        }
      };

      xhr.onerror = () => {
        throw new Error('Network error occurred');
      };

      xhr.open('POST', '/api/images/upload');
      xhr.send(formData);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to upload images'
      });
    } finally {
      setIsUploading(false);
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
            Maximum file size: 200MB
          </p>

          <div className="space-y-4">
            <div className="flex justify-center">
              <label
                htmlFor="file-upload"
                className="cursor-pointer"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
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
                <Progress value={uploadProgress} className="w-full" />
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