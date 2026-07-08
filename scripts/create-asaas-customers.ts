import { supabaseAdmin } from "@/lib/supabase/admin";

const ASAAS_API_KEY = process.env.NEXT_PUBLIC_ASAAS_API_KEY || "";
const ESCOLA_ID = "escola-thales-lima-football-academy-8064";

if (!ASAAS_API_KEY) {
  console.error("❌ ASAAS_API_KEY não configurada em .env.local");
  process.exit(1);
}

async function buscarAtletasSemAsaas() {
  console.log("📥 Buscando atletas sem asaasCustomerId...");
  const { data, error } = await supabaseAdmin
    .from("Atleta")
    .select("id,nome,cpf,telefone")
    .eq("escolaId", ESCOLA_ID)
    .is("asaasCustomerId", null)
    .not("telefone", "is", null);
  if (error) {
    console.error("❌ Erro ao buscar:", error.message);
    process.exit(1);
  }
  const atletas = data.filter((a) => a.telefone?.length >= 11);
  console.log(`✅ Encontrados ${atletas.length} atletas\n`);
  return atletas;
}

async function criarCustomerAsaas(nome: string, cpf: string, telefone: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.asaas.com/v3/customers", {
      method: "POST",
      headers: {
        access_token: ASAAS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: nome, cpfCnpj: cpf, phone: telefone, notificationLevel: "SILENT" }),
    });
    if (!response.ok) {
      const error = await response.json();
      console.warn(`  ⚠️ ${error.errors?.[0]?.detail || error.message}`);
      return null;
    }
    const data = await response.json();
    return data.id;
  } catch (error: any) {
    console.warn(`  ⚠️ Erro: ${error.message}`);
    return null;
  }
}

async function atualizarBanco(atletaId: string, customerId: string) {
  const { error } = await supabaseAdmin.from("Atleta").update({ asaasCustomerId: customerId }).eq("id", atletaId);
  if (error) {
    console.error(`  ❌ ${error.message}`);
    return false;
  }
  return true;
}

async function main() {
  console.log("=".repeat(80));
  console.log("🚀 Criando clientes no Asaas");
  console.log("=".repeat(80) + "\n");

  const atletas = await buscarAtletasSemAsaas();
  if (atletas.length === 0) {
    console.log("✅ Nenhum atleta para processar");
    return;
  }

  let sucesso = 0, erro = 0;
  for (let i = 0; i < atletas.length; i++) {
    const atleta = atletas[i];
    process.stdout.write(`[${String(i + 1).padStart(3, " ")}/${atletas.length}] ${atleta.nome.substring(0, 45).padEnd(45, " ")}`);

    const customerId = await criarCustomerAsaas(atleta.nome, atleta.cpf, atleta.telefone);
    if (customerId && (await atualizarBanco(atleta.id, customerId))) {
      console.log(" ✅");
      sucesso++;
    } else {
      console.log(" ❌");
      erro++;
    }

    if ((i + 1) % 10 === 0 && i + 1 < atletas.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log(`✅ Sucesso: ${sucesso}  |  ❌ Erros: ${erro}`);
  console.log("=".repeat(80));
}

main().catch(console.error);
