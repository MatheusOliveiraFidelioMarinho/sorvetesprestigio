import type { Metadata } from "next";
import LandingVoucher, { type LandingConfig } from "@/components/LandingVoucher";
import { CAMPANHA_SANTA_MARIA_R1, getCampanha } from "@/lib/campanhas";

const campanha = getCampanha(CAMPANHA_SANTA_MARIA_R1);

const TITULO_SEO = "Picolé por R$ 1 | Sorvetes Prestígio Santa Maria";
const DESCRICAO_SEO =
  "Picolé por R$ 1 na Sorvetes Prestígio de Santa Maria. Diversos sabores e sem limite de quantidade: leve quantos quiser.";

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
        alt: "Picolé por R$ 1 na Sorvetes Prestígio Santa Maria",
      },
    ],
  },
};

const config: LandingConfig = {
  campanha: campanha.id,
  unidadeFixa: "Unidade Santa Maria",

  tituloPrefixo: "LEVE QUANTOS QUISER:",
  tituloDestaque: "PICOLÉ POR R$ 1",
  subtitulo:
    "Diversos sabores na Sorvetes Prestígio de Santa Maria, todos por R$ 1. Sem limite de quantidade e sem consumo mínimo.",

  ctaHero: "QUERO MEU CUPOM",
  ctaFormulario: "QUERO MEU CUPOM",
  ctaCarregando: "GERANDO CUPOM...",

  // O picolé de R$ 1 já é praticado na loja: não é oferta escassa que o cupom
  // destrava. Então o bloco de destaque carrega o argumento real de ir até lá —
  // quantidade livre e variedade — em vez de uma contagem regressiva falsa.
  destaqueTitulo: "SEM LIMITE DE QUANTIDADE",
  destaqueTexto:
    "Leve um, leve dez. Diversos sabores no freezer da loja, todos ao mesmo preço de R$ 1.",

  tituloBeneficios: "Por que vale a visita?",
  subtituloBeneficios:
    "O cadastro leva menos de 1 minuto e já te coloca na lista de promoções da unidade. Veja o que te espera na loja:",
  beneficios: [
    {
      text: "Picolé por R$ 1",
      desc: "Preço direto no caixa da unidade Santa Maria.",
    },
    {
      text: "Diversos sabores",
      desc: "Você escolhe no freezer da loja, com mais de 20 opções.",
    },
    {
      text: "Sem limite de quantidade",
      desc: "Leve um ou leve dez. O preço por picolé é o mesmo.",
    },
    {
      text: "Sem consumo mínimo",
      desc: "Não precisa comprar mais nada para levar o seu.",
    },
    {
      text: "Cadastro em menos de 1 minuto",
      desc: "Sem app e sem burocracia. O cupom aparece na hora.",
    },
    {
      text: "Promoções no seu WhatsApp",
      desc: "Você fica sabendo das novidades da unidade Santa Maria antes.",
    },
  ],

  tituloFormulario: "Pegue seu cupom",
  subtituloFormulario:
    "Preencha os dados abaixo, apresente o cupom no caixa e leve quantos picolés quiser por R$ 1 cada.",
  labelUnidade: "Unidade de Retirada",
  erroUnidade: "Unidade de retirada indisponível. Recarregue a página.",

  instrucoes: [
    { destaque: "Tire um print", depois: "desta tela." },
    { antes: "Vá até a", destaque: "Sorvetes Prestígio de Santa Maria." },
    { antes: "Escolha seus sabores entre", destaque: "mais de 20 opções." },
    {
      destaque: "Apresente o cupom",
      depois: "no caixa e informe o telefone cadastrado.",
    },
    {
      destaque: "Leve quantos picolés quiser",
      depois: "por R$ 1 cada.",
    },
  ],

  regulamento: [
    "Picolés participantes ao preço promocional de R$ 1,00 (um real) cada.",
    "Sem limite de quantidade por pessoa.",
    "Não exige consumo mínimo.",
    "Válido na unidade Santa Maria.",
    "A verificação no caixa é feita pelo telefone cadastrado.",
    "Promoção sujeita à disponibilidade de estoque e aos sabores participantes.",
    "Não cumulativa com outras promoções vigentes.",
  ],

  textoCompartilhar:
    "Picolé por R$ 1 na Sorvetes Prestígio de Santa Maria, e pode levar quantos quiser! Pega o teu cupom:",
  rodapeVoucher: "Campanha exclusiva Sorvetes Prestígio - Unidade Santa Maria, DF.",
};

export default function SantaMariaPage() {
  return <LandingVoucher config={config} />;
}
