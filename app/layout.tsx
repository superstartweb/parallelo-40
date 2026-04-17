import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Mail, Phone, Globe, MessageCircle } from "lucide-react";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Menu | Parallelo40",
  description: "Sistema di ordinazione by SuPeR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${montserrat.className} bg-gray-50 flex flex-col min-h-screen text-gray-900`}>
        
        <main className="flex-grow">
          {children}
        </main>

        <footer className="bg-gray-900 text-white py-6 mt-8 rounded-t-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-3">
            <p className="text-sm font-light text-gray-300">
              Tech & Innovation by <strong className="text-parallelo text-lg">SuPeR</strong>
            </p>
            <div className="flex gap-6 mt-2">
              <a href="tel:+393934533500" className="bg-gray-800 p-3 rounded-full hover:bg-parallelo transition-colors duration-300 shadow-md">
                <Phone size={20} className="text-white" />
              </a>
              <a href="https://wa.me/393934533500" target="_blank" rel="noreferrer" className="bg-gray-800 p-3 rounded-full hover:bg-[#25D366] transition-colors duration-300 shadow-md">
                <MessageCircle size={20} className="text-white" />
              </a>
              <a href="mailto:info@superstart.it" className="bg-gray-800 p-3 rounded-full hover:bg-ristorante transition-colors duration-300 shadow-md">
                <Mail size={20} className="text-white" />
              </a>
              <a href="https://www.superstart.it" target="_blank" rel="noreferrer" className="bg-gray-800 p-3 rounded-full hover:bg-white hover:text-gray-900 transition-all duration-300 shadow-md">
                <Globe size={20} />
              </a>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}