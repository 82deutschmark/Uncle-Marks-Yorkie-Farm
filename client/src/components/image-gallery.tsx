import { useState, useEffect } from "react";

interface ImageGalleryProps {
  images?: string[];
}

export function ImageGallery({ images = [] }: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!images.length) return;

    // Change image every 3 seconds
    const imageInterval = setInterval(() => {
      setIsVisible(false);

      // Wait for fade out, then change image
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
        setIsVisible(true);
      }, 500); // Half of the transition duration
    }, 3000);

    return () => {
      clearInterval(imageInterval);
    };
  }, [images.length]);

  if (!images.length) {
    return null;
  }

  return (
    <div className="relative w-full h-48 overflow-hidden rounded-lg bg-muted/20">
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <img
          src={images[currentImageIndex]}
          alt={`Story inspiration ${currentImageIndex + 1}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-50" />
      </div>
    </div>
  );
}