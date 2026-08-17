import type { Metadata } from "next";
import LandingVoucher, { type LandingConfig } from "@/components/LandingVoucher";
import { CAMPANHA_SANTA_MARIA_R1, getCampanha } from "@/lib/campanhas";

const campanha = getCampanha(CAMPANHA_SANTA_MARIA_R1);

const TITULO_SEO = "Picolé por R$ 1 | Sorvetes Prestígio Santa Maria";
const DESCRICAO_SEO =
  "Cadastre-se e retire seu voucher: picolé por R$ 1 na Sorvetes Prestígio de Santa Maria. Mais de 20 sabores.";

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

  tituloPrefixo: "LEVE UM",
  tituloDestaque: "PICOLÉ POR R$ 1",
  subtitulo:
    "Cadastre-se, retire seu voucher e escolha entre mais de 20 sabores na Sorvetes Prestígio de Santa Maria.",

  ctaHero: "QUERO MEU PICOLÉ",
  ctaFormulario: "QUERO MEU PICOLÉ",
  ctaCarregando: "GERANDO VOUCHER...",

  tituloBeneficios: "Por que participar?",
  subtituloBeneficios:
    "Pegar o seu picolé por R$ 1 é simples, rápido e leva menos de 1 minuto. Veja as vantagens:",
  beneficios: [
    {
      text: "Picolé por R$ 1",
      desc: "O preço vale na hora, direto no caixa.",
    },
    {
      text: "Mais de 20 sabores",
      desc: "Você escolhe o seu no freezer da loja.",
    },
    {
      text: "Sem consumo mínimo",
      desc: "O voucher vale sozinho. É só chegar e apresentar.",
    },
    {
      text: "Cadastro em menos de 1 minuto",
      desc: "Sem app e sem burocracia. O voucher aparece na hora.",
    },
    {
      text: "Exclusivo da unidade Santa Maria",
      desc: "Feito para quem é do bairro.",
    },
    {
      text: "Retirada simples no caixa",
      desc: "É só mostrar a tela do voucher no atendimento.",
    },
  ],

  tituloFormulario: "Pegue seu picolé por R$ 1",
  subtituloFormulario: "Preencha os dados abaixo para gerar seu voucher exclusivo.",
  labelUnidade: "Unidade de Retirada",
  erroUnidade: "Unidade de retirada indisponível. Recarregue a página.",

  instrucoes: [
    { destaque: "Tire um print", depois: "desta tela." },
    { antes: "Vá até a", destaque: "Sorvetes Prestígio de Santa Maria." },
    { antes: "Escolha seu sabor entre", destaque: "mais de 20 opções." },
    {
      destaque: "Apresente o voucher",
      depois: "no caixa e informe o telefone cadastrado.",
    },
    {
      destaque: "Leve seu picolé por R$ 1",
      depois: "e aproveite.",
    },
  ],

  regulamento: [
    "Válido para 1 (um) picolé ao preço promocional de R$ 1,00 por número de telefone cadastrado.",
    "Não exige consumo mínimo.",
    "Exclusivo da unidade Santa Maria.",
    `O voucher tem validade de ${campanha.validadeTextoExtenso} a partir do cadastro.`,
    "Necessário apresentar o voucher no momento do atendimento.",
    "A verificação no caixa é feita pelo telefone cadastrado.",
    "Promoção sujeita à disponibilidade de estoque dos picolés participantes.",
    "Não cumulativa com outras promoções vigentes.",
  ],

  textoCompartilhar:
    "Peguei meu picolé por R$ 1 na Sorvetes Prestígio de Santa Maria! Garanta o seu:",
  rodapeVoucher: "Campanha exclusiva Sorvetes Prestígio - Unidade Santa Maria, DF.",
};

export default function SantaMariaPage() {
  return <LandingVoucher config={config} />;
}
