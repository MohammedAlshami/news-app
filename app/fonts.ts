import localFont from "next/font/local"

export const shubbak = localFont({
  src: [
    { path: "../public/fonts/Shubbak-ExtraLight.woff2", weight: "200", style: "normal" },
    { path: "../public/fonts/Shubbak-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/Shubbak-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Shubbak-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/Shubbak-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/Shubbak-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/Shubbak-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../public/fonts/Shubbak-Black.woff2", weight: "900", style: "normal" },
  ],
  display: "swap",
  variable: "--font-shubbak",
})

export const neirizi = localFont({
  src: "../public/fonts/Neirizi.woff2",
  display: "swap",
  variable: "--font-neirizi",
})
