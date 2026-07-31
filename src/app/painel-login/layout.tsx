import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acesso restrito | Sorvetes Prestígio",
  robots: { index: false, follow: false },
};

export default function PainelLoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
