import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import "./globals.css";

const comfortaa = Comfortaa({
  subsets: ["latin", "cyrillic"],
  variable: "--font-comfortaa",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Qalam AI — From raw audio to verified story in minutes.",
  description: "Transcribe bilingual interviews, flag verification risks, and generate publication-ready drafts under full editorial control.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${comfortaa.className} ${comfortaa.variable} h-full dark antialiased`}>
      <body className={`${comfortaa.className} min-h-full flex flex-col bg-[#0b0b0b] text-[#ededed] selection:bg-neutral-800 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}

