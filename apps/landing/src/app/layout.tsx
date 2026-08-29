import type { Metadata } from "next";
import { Ubuntu, Ubuntu_Mono } from "next/font/google";
import "./globals.css";

const ubuntu = Ubuntu({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const ubuntuMono = Ubuntu_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Calory — Train hard. Track everything.",
  description:
    "Calory is the AI fitness coach that builds your workouts, tracks your calories, and keeps you locked on the goals that actually matter.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${ubuntu.variable} ${ubuntuMono.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
