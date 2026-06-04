import Image from "next/image"

type Props = {
  images: { src: string; alt: string }[]
  activeIndex: number
  onSelect: (index: number) => void
}

export function ArticleImageGallery({ images, activeIndex, onSelect }: Props) {
  if (images.length === 0) return null

  return (
    <div className="w-full pb-4 pt-3">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`relative h-20 w-32 shrink-0 overflow-hidden rounded-lg transition-all duration-200 ${
              i === activeIndex ? "ring-2 ring-neutral-400" : "hover:opacity-80"
            }`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover"
              sizes="128px"
              unoptimized
            />
          </button>
        ))}
      </div>
    </div>
  )
}
