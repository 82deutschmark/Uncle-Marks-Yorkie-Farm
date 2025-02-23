import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { BookOpen, Sparkles, Wand2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-serif tracking-tight text-primary sm:text-6xl">
              Uncle Mark's Yorkie Tales
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Create magical storybooks featuring delightful Yorkshire Terriers
            </p>
          </div>

          {/* Main Action - Create Story */}
          <div className="mt-16 flex flex-col items-center">
            <Card className="w-full max-w-2xl border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center justify-center gap-3">
                  <BookOpen className="h-8 w-8" />
                  Create Your Yorkie Tale
                </CardTitle>
                <CardDescription className="text-center text-lg">
                  Generate an enchanting story with AI-illustrated Yorkshire Terrier characters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-center pb-8">
                <div className="space-y-2">
                  <p className="text-muted-foreground">Your story will feature:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Custom Yorkshire Terrier characters brought to life by AI</li>
                    <li>• Magical adventures at Uncle Mark's Farm</li>
                    <li>• Beautiful illustrations in your chosen artistic style</li>
                  </ul>
                </div>
                <Link href="/create/appearance">
                  <Button 
                    size="lg" 
                    className="text-xl py-6 px-12 font-serif transform hover:scale-105 transition-transform"
                  >
                    <Wand2 className="mr-3 h-6 w-6" />
                    Begin Your Story
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Story Creation Process */}
            <div className="mt-12 w-full max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">1. Design Characters</h3>
                  <p className="text-sm text-muted-foreground">Create your unique Yorkie hero</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">2. Generate Story</h3>
                  <p className="text-sm text-muted-foreground">AI creates your unique tale</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Wand2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">3. Enjoy Your Story</h3>
                  <p className="text-sm text-muted-foreground">Read your magical adventure</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}