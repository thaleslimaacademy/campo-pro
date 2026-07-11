# Configurar Meta WhatsApp Business API no GestãoFC

## Variáveis que precisam ir no Vercel

```
META_WABA_TOKEN=EAAxxxxxx
META_PHONE_NUMBER_ID=12345678901
META_WABA_ID=98765432109
META_WEBHOOK_VERIFY=gestaofc2026meta
WHATSAPP_PROVIDER=meta
```

## Templates para criar no Meta Business Manager

| Nome | Categoria | Variáveis |
|------|-----------|-----------|
| cobranca_lembrete | Marketing | resp, atleta, dias, valor, link |
| cobranca_vencimento | Marketing | resp, atleta, valor, link |
| cobranca_atraso | Marketing | resp, atleta, valor, link |
| pagamento_confirmado | Utilidade | resp, atleta, referencia, valor |
| convocacao | Marketing | titulo, data, horario, local |

## URL do webhook Meta
https://gestaofc.com.br/api/webhook/meta
