"use client";  // fichier s'exécute dans le navigateur (côté client)

import "./globals.css";

import { VotingProvider } from "../context/Voter";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import StatusBanner from "../components/StatusBanner";


// Note : si tu veux exporter metadata (SEO), retire "use client" et mets metadata ici
// export const metadata = { title: "Buras Protocol", description: "..." };

export default function RootLayout({
  children, /* représente la page en cours */
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="tech-grid min-h-screen flex flex-col">
        <VotingProvider>  {/* Partage le wallet et ses fonctions à tous */}
          <StatusBanner />
          <Navbar />
          <main className="flex-grow page-fade-in w-full">
            {children}
          </main>
          <Footer />
        </VotingProvider>
      </body>
    </html>
  );
}