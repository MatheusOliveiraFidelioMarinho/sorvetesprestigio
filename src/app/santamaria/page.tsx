import type { Metadata } from "next";
import LandingVoucher, { type LandingConfig } from "@/components/LandingVoucher";
import { CAMPANHA_SANTA_MARIA, getCampanha } from "@/lib/campanhas";

const campanha = getCampanha(CAMPANHA_SANTA_MARIA);

const TITULO_SEO = "Ganhe seu Cartão Fidelidade | Sorvetes Prestígio Santa Maria";
const DESCRICAO_SEO =
  "Cadastre-se, retire seu cartão fidelidade no balcão da Sorvetes Prestígio de Santa Maria e já saia com o primeiro carimbo + uma casquinha por nossa conta.";

export const metadata: Metadata = {
  title: TITULO_SEO,
  description: DESCRICAO_SEO,
  openGraph: {
    title: TITULO_SEO,
    description: DESCRICAO_SEO,
    images: [
      {
        url: "/capa.png",
        width: 1200,
        height: 630,
        alt: "Cartão Fidelidade Sorvetes Prestígio Santa Maria",
      },
    ],
  },
};

const config: LandingConfig = {
  campanha: campanha.id,
  unidadeFixa: "Unidade Santa Maria",

  tituloPrefixo: "GANHE SEU",
  tituloDestaque: "CARTÃO FIDELIDADE",
  subtitulo:
    "Cadastre-se, retire seu cartão no balcão e já saia com o primeiro carimbo + uma casquinha por nossa conta.",

  ctaHero: "QUERO MEU CARTÃO",
  ctaFormulario: "QUERO MEU CARTÃO",
  ctaCarregando: "GERANDO VOUCHER...",

  tituloBeneficios: "Por que participar?",
  subtituloBeneficios:
    "Retirar o seu cartão fidelidade é simples, rápido e leva menos de 1 minuto. Veja as vantagens:",
  beneficios: [
    { text: "A cada 10 idas, a 11ª é grátis", desc: "300g de sorvete por nossa conta." },
    {
      text: "Casquinha grátis já na retirada",
      desc: "Pegue o cartão e saia com o 1º carimbo, consumindo a partir de R$ 10,00.",
    },
    { text: "Cadastro em menos de 1 minuto", desc: "Sem app, sem cadastro complicado." },
    { text: "Retirada no balcão", desc: "É só mostrar a tela no caixa." },
    { text: "Exclusivo da unidade Santa Maria", desc: "Feito para quem é do bairro." },
    { text: "Voucher na hora", desc: "Gerou, pegou." },
  ],

  tituloFormulario: "Retire seu cartão fidelidade",
  subtituloFormulario: "Preencha os dados abaixo para gerar seu voucher exclusivo.",
  labelUnidade: "Unidade de Retirada",
  erroUnidade: "Unidade de retirada indisponível. Recarregue a página.",

  instrucoes: [
    { destaque: "Tire um print", depois: "desta tela." },
    { antes: "Vá até a", destaque: "Sorvetes Prestígio de Santa Maria." },
    { destaque: "Apresente o voucher", depois: "no caixa." },
    { destaque: "Informe o telefone", depois: "cadastrado para validação." },
    { antes: "Consuma", destaque: "a partir de R$ 10,00", depois: "na loja." },
    {
      destaque: "Receba seu cartão fidelidade",
      depois: "já carimbado + a casquinha.",
    },
  ],

  regulamento: [
    "Válido para 1 (um) cartão fidelidade por número de telefone cadastrado.",
    `Validade de ${campanha.validadeTextoExtenso} a partir do cadastro.`,
    "Exclusivo da unidade Santa Maria.",
    "Verificação no caixa mediante telefone cadastrado.",
    "A casquinha grátis da retirada é válida mediante consumo mínimo de R$ 10,00 na loja.",
    // CONFIRMAR COM O CLIENTE antes de publicar: valor mínimo de compra do
    // programa de fidelidade (a ata de 03/07 fala em R$ 15,00) e se a casquinha
    // na retirada exige consumo mínimo.
    "O cartão fidelidade dá direito a 300g de sorvete após 10 compras acima de R$ 15,00, conforme regras do programa.",
    "Não cumulativo com outras promoções vigentes.",
  ],

  textoCompartilhar:
    "Peguei meu cartão fidelidade na Sorvetes Prestígio de Santa Maria! Garanta o seu também:",
  rodapeVoucher: "Campanha exclusiva Sorvetes Prestígio - Unidade Santa Maria, DF.",
};

export default function SantaMariaPage() {
  return <LandingVoucher config={config} />;
}
