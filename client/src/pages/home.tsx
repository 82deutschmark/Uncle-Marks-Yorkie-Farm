import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Dog, Upload } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl relative bg-card/95 backdrop-blur-sm border-2">
        <CardHeader>
          <CardTitle className="text-center text-4xl font-serif mb-2">Uncle Mark's Yorkie Farm</CardTitle>
          <CardDescription className="text-center text-xl">
            Where Yorkshire Terrier Tales Come to Life
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Main Call to Action */}
          <div className="flex justify-center">
            <Link href="/select-yorkie">
              <Button size="lg" className="w-full text-xl py-8 px-12 font-serif transform hover:scale-105 transition-transform">
                <Dog className="mr-3 h-6 w-6" />
                Start Your Farm Tale
              </Button>
            </Link>
          </div>

          {/* Secondary Information - Smaller and Less Prominent */}
          <div className="grid gap-4 md:grid-cols-3 opacity-60 text-sm">
            <div className="text-center p-4">
              <h3 className="font-serif">1. Choose Your Yorkie</h3>
              <p className="text-muted-foreground">
                Pick your favorite Yorkshire Terrier
              </p>
            </div>
            <div className="text-center p-4">
              <h3 className="font-serif">2. Set the Scene</h3>
              <p className="text-muted-foreground">
                Create your perfect story setting
              </p>
            </div>
            <div className="text-center p-4">
              <h3 className="font-serif">3. Generate Story</h3>
              <p className="text-muted-foreground">
                Watch your tale unfold
              </p>
            </div>
          </div>

          {/* Upload Option - Minimal Presence */}
          <div className="text-center opacity-40 hover:opacity-100 transition-opacity">
            <Link href="/upload">
              <Button variant="ghost" size="sm" className="text-xs">
                <Upload className="mr-2 h-3 w-3" />
                Add to Collection
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}