type Props = {
  items: string[]
}

const STARS = Array.from({ length: 8 }, (_, i) => ({
  top: `${15 + Math.random() * 70}%`,
  left: `${5 + Math.random() * 90}%`,
  size: Math.random() < 0.4 ? 3 : 2,
  delay: `${Math.random() * 2}s`,
  duration: `${2 + Math.random() * 2}s`,
  opacity: 0.3 + Math.random() * 0.5,
}))

export function ArticleHighlights({ items }: Props) {
  if (items.length === 0) return null

  return (
    <div
      className="relative mt-6 w-full overflow-hidden rounded-2xl px-6 py-5 sm:p-6"
      style={{
        background: "linear-gradient(135deg, #0d4a6e 0%, #0a6b8a 40%, #0e8fa8 70%, #1aa3b8 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {STARS.map((s, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              width: `${s.size}px`,
              height: `${s.size}px`,
              borderRadius: "50%",
              background: `rgba(255, 255, 255, ${s.opacity})`,
              top: s.top,
              left: s.left,
              animation: `twinkle ${s.duration} ease-in-out infinite alternate`,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>
      <div className="relative">
        <h3 className="mb-3 text-right text-base font-bold text-white">
          {"أبرز النقاط"}
        </h3>
        <ul className="space-y-2 text-right">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-base leading-relaxed text-white">
              <span className="mt-2 flex h-2 w-2 shrink-0 rounded-full bg-white/70" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
