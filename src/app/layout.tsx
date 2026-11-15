import type { Metadata } from "next";
import localFont from "next/font/local";
import "./comfortaa.css";
import "./globals.css";

const comfortaa = localFont({
  src: "../../public/fonts/comfortaa.ttf",
  variable: "--font-comfortaa",
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
    <html lang="ru" className={`${comfortaa.variable} ${comfortaa.className} h-full dark antialiased`}>
      <body className={`${comfortaa.className} min-h-full flex flex-col bg-[#0b0b0b] text-[#ededed] selection:bg-neutral-800 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}

