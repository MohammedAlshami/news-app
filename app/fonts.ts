import localFont from "next/font/local"

// Only the weights referenced by the UI (Tailwind font-normal/medium/semibold/bold/extrabold/black
// and CSS 400-700). ExtraLight (200) and Light (300) are unused, so they are not shipped.
export const shubbak = localFont({
  src: [
    { path: "../public/fonts/Shubbak-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Shubbak-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/Shubbak-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/Shubbak-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/Shubbak-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../public/fonts/Shubbak-Black.woff2", weight: "900", style: "normal" },
  ],
  display: "swap",
  adjustFontFallback: "Arial",
  variable: "--font-shubbak",
})

export const neirizi = localFont({
  src: "../public/fonts/Neirizi.woff2",
  display: "swap",
  // Not referenced by any class today: do not preload it on every page (it is still fetched if used).
  preload: false,
  variable: "--font-neirizi",
})
