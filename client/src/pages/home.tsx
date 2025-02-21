import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Upload, BookOpen, Wand2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl">Yorkshire Terrier Story Generator</CardTitle>
          <CardDescription className="text-center text-lg mt-2">
            Create magical stories featuring your favorite Yorkshire Terriers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Process Steps */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Upload className="mx-auto h-12 w-12 text-primary" />
                  <h3 className="font-semibold">1. Upload Characters</h3>
                  <p className="text-sm text-muted-foreground">
                    Start by uploading your Yorkshire Terrier images. You can upload individual PNGs or a ZIP file containing multiple images.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <BookOpen className="mx-auto h-12 w-12 text-primary" />
                  <h3 className="font-semibold">2. Choose Story Elements</h3>
                  <p className="text-sm text-muted-foreground">
                    Select your Yorkie's characteristics, the story setting, and theme to create a unique adventure.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Wand2 className="mx-auto h-12 w-12 text-primary" />
                  <h3 className="font-semibold">3. Generate Story</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI will weave a magical tale featuring your Yorkshire Terrier characters in their chosen adventure.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Link href="/upload">
              <Button size="lg" className="w-full md:w-auto">
                <Upload className="mr-2 h-4 w-4" />
                Start by Uploading Characters
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Begin your journey by uploading Yorkshire Terrier images. You can upload individual PNG files or a ZIP file containing multiple images.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}