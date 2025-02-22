import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Dog, Loader2, Sparkles, Palette } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Image } from "@shared/schema";

export default function Home() {
  const { data: images, isLoading } = useQuery<Image[]>({
    queryKey: ['/api/images'],
    select: (data) => {
      return data
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
    },
    retry: false
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-serif tracking-tight text-primary sm:text-6xl">
              Uncle Mark's Yorkie Farm
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Where Yorkshire Terrier Tales Come to Life
            </p>
          </div>

          {/* Main Action - Design Your Yorkie */}
          <div className="mt-16 flex flex-col items-center gap-8">
            <Card className="w-full max-w-2xl border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center justify-center gap-3">
                  <Palette className="h-8 w-8" />
                  Design Your Perfect Yorkie
                </CardTitle>
                <CardDescription className="text-center text-lg">
                  Create a unique Yorkshire Terrier companion and embark on a magical adventure
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-8">
                <Link href="/select-yorkie">
                  <Button 
                    size="lg" 
                    className="text-xl py-6 px-12 font-serif transform hover:scale-105 transition-transform"
                  >
                    <Sparkles className="mr-3 h-6 w-6" />
                    Start Your Journey
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Featured Yorkies - Less Prominent */}
            <div className="w-full max-w-2xl opacity-70 hover:opacity-100 transition-opacity">
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Dog className="h-4 w-4" />
                    Featured Companions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {isLoading ? (
                      <div className="col-span-2 flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      images?.map((image) => (
                        <div key={image.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={`/uploads/${image.path}`}
                            alt="Yorkshire Terrier"
                            className="object-cover w-full h-full hover:scale-105 transition-transform"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}