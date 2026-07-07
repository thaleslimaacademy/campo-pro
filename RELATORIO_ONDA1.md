# Relatório Onda 1 - fix_asaas_whatsapp.py

## 1. Bug desconto/multa invertido (Asaas)

- ENCONTRADO `app/api/cobranca/route.ts` com `asaas`+`discount`, mas o padrao exato (value inflado + discount bloco) nao bateu com o esperado.
  Revisao manual necessaria neste arquivo especifico.

- ENCONTRADO `lib/asaas.ts` com `asaas`+`discount`, mas o padrao exato (value inflado + discount bloco) nao bateu com o esperado.
  Revisao manual necessaria neste arquivo especifico.


## 2. Rate limit no disparo de WhatsApp

- ENCONTRADO `app/(app)/comissao/actions.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/(app)/atletas/[id]/LinkMatricula.tsx` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/webhook/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/webhook/asaas/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/cobranca-mensal/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/cobranca-reemissao/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/whatsapp-aprovacao/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/notificar-convocacao/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/aniversariantes/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/nps/enviar/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/convite/criar/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/cobranca/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/cobranca/acao/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/whatsapp-config/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/cobranca-manual/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/inadimplentes/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/lembretes/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/api/matricula/aviso-admin/route.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/loja/actions.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `app/loja/[slug]/actions.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).

- ENCONTRADO `lib/whatsapp.ts` mas nao achei um loop `for` claro chamando o envio.
  Revisao manual necessaria (pode ser Promise.all ou map, que precisa de tratamento diferente para nao rodar tudo em paralelo).
