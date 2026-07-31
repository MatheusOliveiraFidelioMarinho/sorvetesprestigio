import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel do Caixa | Sorvetes Prestígio",
  robots: { index: false, follow: false },
};

export default function PainelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
