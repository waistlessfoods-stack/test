"use client";

import Image from 'next/image';
import { useId, useState } from 'react';
import { serviceGalleryPhotos } from '@/lib/service-gallery';

export default function ServiceGallery({ title, mainImage, gallery }: { title: string; mainImage: string | null; gallery: (string | null)[] }) {
  const photos = serviceGalleryPhotos(mainImage, gallery);
  // Reset selection if a published update removes/reorders the selected photo.
  return <Gallery key={JSON.stringify(photos)} title={title} photos={photos} />;
}

function Gallery({ title, photos }: { title: string; photos: string[] }) {
  const [selected, setSelected] = useState(0);
  const imageId = useId();
  return <div role="group" aria-label={`${title} photos`} className="flex w-full flex-col gap-4">
    <div id={imageId} className="relative aspect-[5/6] w-full overflow-hidden bg-gray-200">
      {photos[selected] && <Image src={photos[selected]} alt={`${title} main image`} fill sizes="(max-width: 1024px) 100vw, 520px" className="object-cover" priority />}
    </div>
    {photos.length > 1 && <div className="grid w-full grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:gap-3">
      {photos.map((photo, index) => <button key={photo} type="button" onClick={() => setSelected(index)} aria-label={`Show ${title} photo ${index + 1} of ${photos.length}`} aria-controls={imageId} aria-pressed={selected === index} className={`group relative aspect-square overflow-hidden outline-offset-2 transition-all hover:ring-2 hover:ring-primary focus-visible:outline-2 focus-visible:outline-primary ${selected === index ? 'ring-2 ring-primary' : ''}`}>
        <Image src={photo} alt={`${title} gallery image ${index + 1}`} fill sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 100px" className="object-cover transition-transform duration-300 group-hover:scale-110" />
      </button>)}
    </div>}
  </div>;
}
