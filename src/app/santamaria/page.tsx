import type { Metadata } from "next";
import LandingVoucher, { type LandingConfig } from "@/components/LandingVoucher";
import { CAMPANHA_SANTA_MARIA, getCampanha } from "@/lib/campanhas";

const campanha = getCampanha(CAMPANHA_SANTA_MARIA);

const TITULO_SEO = "Picolé Grátis + 2 Carimbos | Sorvetes Prestígio Santa Maria";
const DESCRICAO_SEO =
  "Cadastre-se, gaste R$ 15,00 na Sorvetes Prestígio de Santa Maria e leve um picolé grátis + 2 carimbos no cartão fidelidade.";

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
        alt: "Picolé grátis + 2 carimbos na Sorvetes Prestígio Santa Maria",
      },
    ],
  },
};

const config: LandingConfig = {
  campanha: campanha.id,
  unidadeFixa: "Unidade Santa Maria",

  tituloPrefixo: "GANHE UM",
  tituloDestaque: "PICOLÉ GRÁTIS",
  subtitulo:
    "Cadastre-se, gaste R$ 15,00 na loja e saia com um picolé grátis e 2 carimbos no seu cartão fidelidade.",

  ctaHero: "QUERO MEU PICOLÉ",
  ctaFormulario: "QUERO MEU PICOLÉ",
  ctaCarregando: "GERANDO VOUCHER...",

  tituloBeneficios: "Por que participar?",
  subtituloBeneficios:
    "Pegar o seu picolé grátis é simples, rápido e leva menos de 1 minuto. Veja as vantagens:",
  beneficios: [
    {
      text: "Picolé grátis na hora",
      desc: "Consumiu R$ 15,00? O picolé sai na mesma visita.",
    },
    {
      text: "2 carimbos de brinde",
      desc: "Você já começa o cartão fidelidade com 2 de 10 preenchidos.",
    },
    {
      text: "10 carimbos = 300 g grátis",
      desc: "Cada compra acima de R$ 15,00 vale 1 carimbo. Faltam só 8.",
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

  tituloFormulario: "Pegue seu picolé grátis",
  subtituloFormulario: "Preencha os dados abaixo para gerar seu voucher exclusivo.",
  labelUnidade: "Unidade de Retirada",
  erroUnidade: "Unidade de retirada indisponível. Recarregue a página.",

  instrucoes: [
    { destaque: "Tire um print", depois: "desta tela." },
    { antes: "Vá até a", destaque: "Sorvetes Prestígio de Santa Maria." },
    { antes: "Consuma", destaque: "R$ 15,00 ou mais", depois: "na loja." },
    {
      destaque: "Apresente o voucher",
      depois: "no caixa e informe o telefone cadastrado.",
    },
    {
      destaque: "Receba seu picolé grátis + 2 carimbos",
      depois: "no cartão fidelidade.",
    },
  ],

  regulamento: [
    "Válido para 1 (um) picolé grátis por número de telefone cadastrado.",
    "Válido exclusivamente mediante consumo mínimo de R$ 15,00 na loja.",
    "Exclusivo da unidade Santa Maria.",
    `O voucher tem validade de ${campanha.validadeTextoExtenso} a partir do cadastro.`,
    "Necessário apresentar o voucher no momento do atendimento.",
    "A verificação no caixa é feita pelo telefone cadastrado.",
    "Os 2 carimbos de brinde são creditados no cartão fidelidade no ato da retirada. O cartão completo (10 carimbos) dá direito a 300 g de sorvete grátis, sendo que cada carimbo corresponde a uma compra acima de R$ 15,00.",
    "Promoção sujeita à disponibilidade de estoque dos picolés participantes.",
    "Não cumulativa com outras promoções vigentes.",
  ],

  textoCompartilhar:
    "Ganhei um picolé grátis na Sorvetes Prestígio de Santa Maria! Garanta o seu:",
  rodapeVoucher: "Campanha exclusiva Sorvetes Prestígio - Unidade Santa Maria, DF.",
};

export default function SantaMariaPage() {
  return <LandingVoucher config={config} />;
}
