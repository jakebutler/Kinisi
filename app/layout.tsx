import "./globals.css";
// Third-party CSS should be imported from entry points, not via @import in CSS
// FullCalendar v6 does not export CSS files; styles are included via JS bundles.
import { AuthProvider } from "@/components/context/AuthContext";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { Nunito, Open_Sans, Lato } from "next/font/google";

// Global body font
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });
// Expose as CSS variables so they load and are available as fallbacks
const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap", variable: "--font-open-sans" });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"], display: "swap", variable: "--font-lato" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.className} ${openSans.variable} ${lato.variable} antialiased aura-hero min-h-screen`}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AuthProvider>
          <NavBar />
          <main id="main-content" tabIndex={-1}>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
