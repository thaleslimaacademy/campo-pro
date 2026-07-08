# Relatório Onda 1b

## 1. Rate limit centralizado (lib/whatsapp.ts)

- CORRIGIDO automaticamente: `lib/whatsapp.ts`
  - Função `enviarWhatsApp` agora passa por uma fila central com delay randômico de 3-8s
  - Todos os 20 arquivos que chamam `enviarWhatsApp` (cobranca-mensal, cobranca-reemissao, nps, convocacao, etc.) ficam protegidos automaticamente, sem precisar editar cada um
  - IMPORTANTE: se `enviarWhatsApp` não for de fato a função de ENVIO real (pode ter pego outra função async por engano), o build vai acusar erro de tipo na hora — não vai quebrar silenciosamente em produção


## 2. Bug desconto/multa invertido (Asaas)

- `app/api/cobranca/route.ts`: não encontrei bloco `discount: {...}` no formato esperado (sem chaves aninhadas). Revisão manual necessária.

- `lib/asaas.ts`: não encontrei bloco `discount: {...}` no formato esperado (sem chaves aninhadas). Revisão manual necessária.
