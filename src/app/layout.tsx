import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Script from "next/script";
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
      <head>
        {/* Meta Pixel Code */}
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '27974257345510623');
            fbq('track', 'PageView');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white text-slate-800">
        {/* Fallback no-script para o Meta Pixel */}
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=27974257345510623&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
