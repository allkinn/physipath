import type { Metadata } from "next";
import MainNav from "../components/MainNav";
import AppFooter from "../components/AppFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "PhysiPath",
  description: "AI Physics Diagnostic Learning Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <MainNav />
        {children}
        <AppFooter />
      </body>
    </html>
  );
}