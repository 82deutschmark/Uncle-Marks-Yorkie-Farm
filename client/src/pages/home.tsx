import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Flower2, Sun, Dog, Upload } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 text-primary/10">
          <Flower2 className="w-full h-full" />
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 text-primary/10">
          <Sun className="w-full h-full" />
        </div>
      </div>
      <Card className="w-full max-w-3xl relative bg-card/95 backdrop-blur-sm border-2">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-serif">Uncle Mark's Yorkie Farm</CardTitle>
          <CardDescription className="text-center text-lg mt-2">
            Where Yorkshire Terrier Tales Come to Life
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Process Steps */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2 border-primary/20 bg-card/50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Dog className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-serif font-semibold">1. Choose Your Yorkie</h3>
                  <p className="text-sm text-muted-foreground">
                    Select your favorite Yorkshire Terrier from our charming farm residents
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-card/50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Flower2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-serif font-semibold">2. Set the Scene</h3>
                  <p className="text-sm text-muted-foreground">
                    Create the perfect farm setting for your Yorkie's adventure
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-card/50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Sun className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-serif font-semibold">3. Generate Story</h3>
                  <p className="text-sm text-muted-foreground">
                    Watch as your Yorkie's tale unfolds in our magical farm setting
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Link href="/create">
              <Button size="lg" className="w-full md:w-auto font-serif">
                <Dog className="mr-2 h-4 w-4" />
                Start Your Farm Tale
              </Button>
            </Link>

            {/* Advanced feature - less prominent */}
            <div className="text-center mt-8 border-t border-primary/20 pt-6">
              <p className="text-sm text-muted-foreground mb-2 font-serif">For Farm Contributors</p>
              <Link href="/upload">
                <Button variant="outline" size="sm" className="font-serif">
                  <Upload className="mr-2 h-4 w-4" />
                  Add to Our Yorkie Collection
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}