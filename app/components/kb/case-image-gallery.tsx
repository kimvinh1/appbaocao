'use client';

import { ExternalLink, ImageIcon } from 'lucide-react';
import { useState } from 'react';

type CaseImageGalleryProps = {
  imageUrls: string[];
  title: string;
};

export function CaseImageGallery({ imageUrls, title }: CaseImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (imageUrls.length === 0) {
    return null;
  }

  const activeIndex = Math.min(selectedIndex, imageUrls.length - 1);
  const activeImage = imageUrls[activeIndex];

  return (
    <div className="mt-3 rounded-2xl border border-slate-300/60 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-950/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-600 dark:text-slate-500 dark:text-slate-400">
          <ImageIcon size={14} /> Ảnh hiện trường
        </p>
        <span className="rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] text-slate-600 dark:text-slate-500 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700">
          {activeIndex + 1}/{imageUrls.length}
        </span>
      </div>

      <a
        href={activeImage}
        target="_blank"
        rel="noopener noreferrer"
        className="group mt-3 block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage}
          alt={`${title} - ảnh ${activeIndex + 1}`}
          className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      </a>

      {imageUrls.length > 1 ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {imageUrls.map((imageUrl, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={`${imageUrl}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`overflow-hidden rounded-xl border p-1 transition ${
                  isActive
                    ? 'border-cyan-400/60 bg-cyan-500/10 ring-1 ring-cyan-400/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-700'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={`${title} - thumbnail ${index + 1}`}
                  className="h-20 w-full rounded-lg object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-3 flex justify-end">
        <a
          href={activeImage}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-700 transition hover:bg-white/10"
        >
          <ExternalLink size={14} /> Mở ảnh gốc
        </a>
      </div>
    </div>
  );
}
