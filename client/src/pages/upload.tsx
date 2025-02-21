import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: result.message
        });
      } else {
        throw new Error(result.message);
      }
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
            Upload PNG images or ZIP files containing PNG images of Yorkshire terriers
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
                    Click to select file
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
