import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ImageKitProvider } from "@imagekit/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumen — Learn by building real projects",
  description:
    "Project-based video courses that turn complex topics into clear, step-by-step lessons.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Course images are ImageKit paths; this supplies the endpoint to every <Image> from @imagekit/next. */}
        <ImageKitProvider urlEndpoint={process.env.IMAGEKIT_URL_ENDPOINT}>{children}</ImageKitProvider>
      </body>
    </html>
  );
}
