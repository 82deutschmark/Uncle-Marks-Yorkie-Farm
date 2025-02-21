import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Wand2, BookOpen, ImageIcon, Upload } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl">Uncle Mark's Yorkie Farm</CardTitle>
          <CardDescription className="text-center text-lg mt-2">
            Create magical stories featuring adorable Yorkshire Terriers from Uncle Mark's Farm
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Process Steps */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <BookOpen className="mx-auto h-12 w-12 text-primary" />
                  <h3 className="font-semibold">1. Describe Your Story</h3>
                  <p className="text-sm text-muted-foreground">
                    Tell us about the Yorkshire Terrier characteristics, setting, and theme you'd like in your story.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <ImageIcon className="mx-auto h-12 w-12 text-primary" />
                  <h3 className="font-semibold">2. Choose Characters</h3>
                  <p className="text-sm text-muted-foreground">
                    Select from our curated collection of Yorkshire Terrier images that match your story's needs.
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
                    Our AI will create a delightful tale featuring your chosen Yorkshire Terrier characters.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Link href="/create">
              <Button size="lg" className="w-full md:w-auto">
                <BookOpen className="mr-2 h-4 w-4" />
                Start Creating Your Story
              </Button>
            </Link>

            {/* Advanced feature - less prominent */}
            <div className="text-center mt-8 border-t pt-6">
              <p className="text-sm text-muted-foreground mb-2">For Contributors</p>
              <Link href="/upload">
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Yorkshire Terrier Images
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}