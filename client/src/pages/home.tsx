import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Dog, Upload, Loader2, Sparkles, Palette } from "lucide-react";
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

          {/* Main Actions */}
          <div className="mt-16 flex flex-col items-center gap-8">
            <div className="grid gap-6 md:grid-cols-2 w-full max-w-4xl">
              {/* Design a Yorkie Card */}
              <Card className="relative overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-6 w-6" />
                    Design Your Yorkie
                  </CardTitle>
                  <CardDescription>
                    Create your perfect Yorkshire Terrier companion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/select-yorkie">
                    <Button 
                      size="lg" 
                      className="w-full font-serif"
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      Start Designing
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Featured Yorkies Card */}
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dog className="h-6 w-6" />
                    Featured Companions
                  </CardTitle>
                  <CardDescription>
                    Meet some of our adorable Yorkshire Terriers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {isLoading ? (
                      <div className="col-span-2 flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
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

            {/* Upload Section */}
            <div className="w-full max-w-4xl">
              <Card className="bg-muted/50">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-center md:text-left">
                      <h3 className="text-lg font-semibold">Have Your Own Yorkie Photos?</h3>
                      <p className="text-sm text-muted-foreground">
                        Add your Yorkshire Terrier photos to our collection
                      </p>
                    </div>
                    <Link href="/upload">
                      <Button variant="outline" size="lg">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Photos
                      </Button>
                    </Link>
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