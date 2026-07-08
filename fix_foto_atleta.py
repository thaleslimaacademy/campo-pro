import re

# ── 1. Cria/atualiza app/(app)/atletas/[id]/foto-actions.ts ──
actions_path = "app/(app)/atletas/[id]/foto-actions.ts"
actions_content = '''\'use server\'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function salvarFotoAtleta(atletaId: string, base64: string, ext: string) {
  const buf = Buffer.from(base64.replace(/^data:.+;base64,/, ''), 'base64')
  const path = `${atletaId}.${ext}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('atletas')
    .upload(path, buf, { contentType: `image/${ext}`, upsert: true })

  if (uploadError) throw new Error('Erro ao enviar foto: ' + uploadError.message)

  const { data } = supabaseAdmin.storage.from('atletas').getPublicUrl(path)
  const url = data.publicUrl + '?t=' + Date.now()

  const { error: updateError } = await supabaseAdmin
    .from('Atleta')
    .update({ fotoUrl: url })
    .eq('id', atletaId)

  if (updateError) throw new Error('Erro ao salvar foto no banco: ' + updateError.message)

  revalidatePath(`/atletas/${atletaId}`)
  return { ok: true, url }
}
'''

with open(actions_path, "w", encoding="utf-8") as f:
    f.write(actions_content)
print(f"✅ Criado: {actions_path}")

# ── 2. Patch FotoAtleta.tsx ──
foto_path = "app/(app)/atletas/[id]/FotoAtleta.tsx"
with open(foto_path, "r", encoding="utf-8") as f:
    content = f.read()

if "salvarFotoAtleta" not in content:
    lines = content.split("\n")
    insert_idx = 0
    for i, line in enumerate(lines):
        if line.strip().startswith("import"):
            insert_idx = i + 1
    lines.insert(insert_idx, "import { salvarFotoAtleta } from './foto-actions'")
    content = "\n".join(lines)

old_handler = """    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `${atletaId}.${ext}`
    const { error } = await supabase.storage.from('atletas').upload(path, file, { upsert: true })
    if (error) { alert('Erro ao enviar foto: ' + error.message); setUploading(false); return }
    const { data } = supabase.storage.from('atletas').getPublicUrl(path)
    const novaUrl  = data.publicUrl + '?t=' + Date.now()
    await supabase.from('Atleta').update({ fotoUrl: novaUrl }).eq('id', atletaId)
    setFoto(novaUrl)
    setUploading(false)"""

new_handler = """    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop() || 'jpg'
    try {
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const { url } = await salvarFotoAtleta(atletaId, base64, ext)
      setFoto(url)
    } catch (err: any) {
      alert('Erro ao enviar foto: ' + err.message)
    }
    setUploading(false)"""

if old_handler not in content:
    print("⚠️  Handler antigo não encontrado exatamente — nenhuma alteração feita.")
else:
    content = content.replace(old_handler, new_handler)
    print("✅ Handler de upload substituído (agora usa server action).")

with open(foto_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"✅ Patch aplicado em: {foto_path}")
