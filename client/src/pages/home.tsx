
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Sparkles, Wand2, RefreshCcw } from "lucide-react";

interface YorkieImage {
  id: string;
  url: string;
}

export default function Home() {
  const [yorkies, setYorkies] = useState<YorkieImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRandomYorkies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/images/random');
      const data = await response.json();
      setYorkies(data.images);
    } catch (error) {
      console.error('Failed to fetch Yorkies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomYorkies();
  }, []);

  return (
    <div className="min-h-screen bg-background">
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

          <div className="mt-16">
            <Card className="w-full max-w-4xl mx-auto border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Choose Your Yorkie Friend</CardTitle>
                <CardDescription className="text-center">
                  Pick one of these magical companions or refresh for more options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  {yorkies.map((yorkie) => (
                    <div key={yorkie.id} className="relative">
                      <div className="aspect-square mb-4 relative overflow-hidden rounded-lg">
                        <img 
                          src={yorkie.url} 
                          alt="Yorkshire Terrier" 
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <Link href="/create/appearance">
                        <Button className="w-full">Select This Yorkie</Button>
                      </Link>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={fetchRandomYorkies}
                    className="gap-2"
                    disabled={loading}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Show Different Yorkies
                  </Button>
                  <Link href="/create/appearance">
                    <Button className="gap-2">
                      <Wand2 className="h-4 w-4" />
                      Start Your Adventure
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="mt-12 w-full max-w-2xl mx-auto">
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
