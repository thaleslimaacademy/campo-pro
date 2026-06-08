export const DEFAULT_TEMPLATE = `Olá {{nome}}, tudo bem? 😊

Gostaríamos de informar que seu patrocínio com a *Thales Lima Football Academy* no valor de *{{valor}}* vence em *{{vencimento}}*.

Para renovar ou tirar dúvidas, entre em contato conosco. 🙏

Atenciosamente,
*Thales Lima – TLFA* 🐾`

export type Patrocinador = {
  id: string
  nome: string
  empresa: string | null
  telefone: string | null
  valor: number
  vencimento: string
  status: string
  descricao: string | null
  mensagemCobranca: string | null
  createdAt: string
}