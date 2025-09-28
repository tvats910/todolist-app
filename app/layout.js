// app/layout.js

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// ... other imports if you have them

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Tushar's TodoList",
  description: "A simple and beautiful todo list app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-100`} 
        // <-- Change bg-slate-50 to your chosen color here
      >
        {children}
      </body>
    </html>
  );
}