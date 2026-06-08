import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Ganhe um Picolé Grátis | Sorvetes Prestígio",
  description: "Cadastre-se gratuitamente e receba seu voucher exclusivo para retirar um picolé promocional na Sorvetes Prestígio em Santa Maria - DF.",
  openGraph: {
    title: "Ganhe um Picolé Grátis | Sorvetes Prestígio",
    description: "Cadastre-se gratuitamente e receba seu voucher exclusivo para retirar um picolé promocional na Sorvetes Prestígio em Santa Maria - DF.",
    images: [
      {
        url: "/capa.png",
        width: 1200,
        height: 630,
        alt: "Campanha Sorvetes Prestígio",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} h-full antialiased scroll-smooth`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-slate-800">
        {children}
      </body>
    </html>
  );
}
