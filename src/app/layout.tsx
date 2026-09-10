import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chestionar de evaluare — curs management anti-mită | AEP",
  description:
    "Chestionar anonim de evaluare a calității cursului de management anti-mită, Autoritatea Electorală Permanentă.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
