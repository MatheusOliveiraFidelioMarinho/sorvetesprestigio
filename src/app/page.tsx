import LandingVoucher, { type LandingConfig } from "@/components/LandingVoucher";
import { CAMPANHA_PADRAO, getCampanha } from "@/lib/campanhas";

const campanha = getCampanha(CAMPANHA_PADRAO);

const config: LandingConfig = {
  campanha: campanha.id,
  // Sem unidadeFixa: o dropdown de unidades continua aparecendo como hoje.

  tituloPrefixo: "GANHE UM",
  tituloDestaque: "PICOLÉ GRÁTIS",
  subtitulo:
    "Cadastre-se gratuitamente e receba seu voucher exclusivo para retirar um picolé promocional na Sorvetes Prestígio.",

  ctaHero: "QUERO MEU VOUCHER",
  ctaFormulario: "GERAR MEU VOUCHER",
  ctaCarregando: "GERANDO VOUCHER...",

  tituloBeneficios: "Por que participar?",
  subtituloBeneficios:
    "Retirar o seu picolé gratuito é super simples, rápido e transparente. Veja as vantagens:",
  beneficios: [
    {
      text: "Ganhe um picolé promocional grátis",
      desc: "Ganhe um picolé participante nas compras acima de R$ 10,00.",
    },
    {
      text: "Cadastro rápido e gratuito",
      desc: "Leva menos de 1 minuto e você já garante o seu.",
    },
    {
      text: "Retirada simples no caixa",
      desc: "Basta ir à loja, realizar sua compra e apresentar a tela.",
    },
    {
      text: "Válido em Nossas Unidades",
      desc: "Unidade 320, Unidade 314, Unidade Santa Maria e Unidade Areal.",
    },
    {
      text: "Voucher gerado instantaneamente",
      desc: "Nada de e-mails demorados. Gerou, pegou.",
    },
    {
      text: "Participação limitada",
      desc: "Limite de 1 picolé por telefone cadastrado.",
    },
  ],

  tituloFormulario: "Retire seu voucher agora",
  subtituloFormulario: "Preencha os dados abaixo para gerar seu voucher exclusivo.",
  labelUnidade: "Unidade de Retirada *",
  erroUnidade: "Por favor, selecione qual unidade deseja retirar seu picolé.",

  instrucoes: [
    { destaque: "Tire um print", depois: "desta tela do voucher." },
    { antes: "Consuma", destaque: "acima de R$ 10,00", depois: "na loja." },
    { destaque: "Apresente o voucher", depois: "no caixa da Sorvetes Prestígio." },
    { destaque: "Informe o telefone", depois: "cadastrado para validação." },
    { destaque: "Receba seu benefício", depois: "promocional grátis!" },
  ],

  regulamento: [
    "Válido exclusivamente para a retirada de 1 (um) picolé por número de telefone / CPF cadastrado.",
    "A verificação no caixa será realizada mediante apresentação de documento oficial com foto ou WhatsApp aberto que comprove o número registrado no cadastro.",
    `O voucher gerado possui validade de ${campanha.validadeTextoExtenso} a partir da data de cadastro.`,
    "Necessário apresentar o voucher gerado no momento do atendimento.",
    "Válido exclusivamente mediante compra acima de R$ 10,00 na loja.",
    "Promoção sujeita à disponibilidade de estoque dos picolés participantes.",
    "Não cumulativo com outras promoções e descontos vigentes na loja.",
    "A empresa poderá encerrar a campanha ao atingir o limite estipulado de vouchers sem aviso prévio.",
  ],

  textoCompartilhar:
    "Ganhei um picolé grátis na Sorvetes Prestígio! Garanta o seu também antes que acabe:",
  rodapeVoucher: "Campanha exclusiva Sorvetes Prestígio - Santa Maria, DF.",
};

export default function Home() {
  return <LandingVoucher config={config} />;
}
