'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Zap } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/3] rounded-2xl bg-graphite-100 border border-graphite-200 flex flex-col items-center justify-center text-graphite-400">
        <Zap className="w-16 h-16 stroke-1 mb-2" />
        <span className="text-sm font-medium">Фото товару відсутнє</span>
      </div>
    );
  }

  const currentImage = images[selectedIndex] || images[0];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-[4/3] rounded-2xl bg-white border border-graphite-200 overflow-hidden shadow-xs">
        <Image
          src={currentImage}
          alt={productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-6 transition-all duration-300"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-20 h-20 rounded-xl bg-white border-2 overflow-hidden shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                selectedIndex === idx
                  ? 'border-brand-600 shadow-md scale-95'
                  : 'border-graphite-200 hover:border-graphite-300 opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={img}
                alt={`${productName} фото ${idx + 1}`}
                fill
                sizes="80px"
                className="object-contain p-2"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
