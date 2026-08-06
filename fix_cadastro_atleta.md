# Correção — cadastro de atleta grava atleta órfão e mostra erro genérico

Cole este arquivo inteiro no Claude Code dentro de `~/Desktop/campo-pro`.

---

## Diagnóstico (já confirmado no banco e nos logs do Postgres)

Ao cadastrar um atleta em `/atletas/novo` preenchendo o **Responsável 2 só com o nome**
(sem WhatsApp), acontece isto:

1. O `INSERT` em `Atleta` funciona.
2. O `INSERT` em `Responsavel` falha com:
   `null value in column "telefone" of relation "Responsavel" violates not-null constraint`
3. Os dois responsáveis são inseridos em **uma única chamada** `.insert([resp1, resp2])`.
   No Postgres isso é um só statement, tudo-ou-nada — o responsável 2 inválido derruba o
   responsável 1 válido junto. Resultado: `0` responsáveis.
4. A server action faz `throw`, e em produção o Next.js troca a exceção pela mensagem
   genérica "An error occurred in the Server Components render... digest".
5. Nada faz rollback do atleta já inserido → cada clique deixa um atleta órfão.
   Três cliques = três registros duplicados sem responsável, sem cobrança e sem cliente Asaas.

## Arquivos a alterar

- `app/(app)/atletas/novo/actions.ts`
- `app/(app)/atletas/novo/page.tsx` (ou o componente de formulário que ele usa)

Adapte os nomes reais das variáveis do formulário — o que importa é a lógica abaixo.

---

## 1. `actions.ts` — helper que monta o responsável

Adicione perto do topo do arquivo (ou em `lib/`, se preferir reaproveitar na rematrícula):

```ts
const soDigitos = (v?: string | null) => (v ?? '').replace(/\D/g, '')

type ResponsavelInput = {
  nome?: string | null
  whatsapp?: string | null
  cpf?: string | null
  parentesco?: string | null
  email?: string | null
}

/**
 * Monta a linha de Responsavel. Retorna null quando o responsável está
 * incompleto (sem nome ou sem telefone válido) — nesse caso ele NÃO entra
 * no insert, em vez de quebrar o statement inteiro.
 */
function montarResponsavel(
  atletaId: string,
  r: ResponsavelInput,
  principal: boolean,
) {
  const nome = (r.nome ?? '').trim()
  const fone = soDigitos(r.whatsapp)

  if (!nome || fone.length < 10) return null

  return {
    id: crypto.randomUUID(),
    atletaId,
    nome,
    telefone: fone,   // coluna NOT NULL — era isso que chegava nulo
    whatsapp: fone,
    cpf: soDigitos(r.cpf) || null,
    parentesco: r.parentesco?.trim() || null,
    email: r.email?.trim() || null,
    principal,
  }
}
```

## 2. `actions.ts` — substituir o insert dos responsáveis

Troque o bloco atual que insere os responsáveis por:

```ts
const responsaveis = [
  montarResponsavel(atleta.id, resp1, true),
  montarResponsavel(atleta.id, resp2, false),
].filter((r): r is NonNullable<typeof r> => r !== null)

if (responsaveis.length === 0) {
  await supabaseAdmin.from('Atleta').delete().eq('id', atleta.id)
  return { ok: false, erro: 'Informe ao menos um responsável com nome e WhatsApp.' }
}

const { error: errResp } = await supabaseAdmin
  .from('Responsavel')
  .insert(responsaveis)

if (errResp) {
  // rollback manual: não deixa atleta órfão no banco
  await supabaseAdmin.from('Atleta').delete().eq('id', atleta.id)
  return { ok: false, erro: `Erro ao salvar responsáveis: ${errResp.message}` }
}
```

## 3. `actions.ts` — nunca lançar exceção para o usuário

Regra para o projeto inteiro: **server action não faz `throw`**. Todo `throw` em produção
vira a mensagem genérica com digest, e o motivo real se perde.

Envolva o corpo da action e devolva o erro:

```ts
try {
  // ... todo o fluxo de cadastro
  return { ok: true, atletaId: atleta.id }
} catch (e) {
  console.error('[cadastrarAtleta]', e)
  return { ok: false, erro: e instanceof Error ? e.message : 'Erro inesperado ao cadastrar.' }
}
```

E confirme que a tela já trata `ok: false` exibindo `erro` na faixa vermelha.

**Atenção:** se houver `redirect()` do `next/navigation` dentro desse `try`, ele precisa sair
para fora do bloco — `redirect()` funciona lançando `NEXT_REDIRECT`, e o `catch` engoliria.

## 4. `page.tsx` — validação antes de enviar

```ts
if (resp2Nome.trim() && soDigitos(resp2Whatsapp).length < 10) {
  setErro('Responsável 2: preencha o WhatsApp ou apague o nome.')
  return
}
```

## 5. `page.tsx` — travar o botão durante o envio

Foi a falta disso que transformou 1 cadastro em 3 registros:

```tsx
<button disabled={salvando} onClick={handleSubmit}>
  {salvando ? 'Cadastrando...' : '✅ CADASTRAR ATLETA'}
</button>
```

Garanta que `setSalvando(true)` acontece na primeira linha do handler e que o
`setSalvando(false)` está num `finally`.

---

## Antes de commitar

```bash
npx tsc --noEmit
```

Obrigatório: `next.config` está com `ignoreBuildErrors`, então erro de TypeScript passa
pelo build e vai direto para produção.

## Teste de aceite

1. Cadastrar atleta com Responsável 2 só com o nome → deve **salvar normal**, ignorando o
   responsável 2 incompleto (ou avisar antes de enviar, pela validação do item 4).
2. Forçar um erro no insert de responsáveis → nenhum atleta órfão deve sobrar no banco.
3. Clicar duas vezes rápido no botão → apenas 1 registro criado.

## Depois de subir

```bash
git add -A && git commit -m "fix: cadastro de atleta nao deixa mais atleta orfao quando responsavel 2 esta incompleto"
git push && npx vercel --prod
```
