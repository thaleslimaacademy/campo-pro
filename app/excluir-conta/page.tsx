export default function ExcluirContaPage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px', fontFamily: 'Inter, sans-serif', color: '#1a1a1a', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Exclusão de Conta e Dados</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>GestaoFC — Plataforma de Gestão para Academias de Futebol</p>

      <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 8, padding: '16px 20px', marginBottom: 32 }}>
        <strong>⚠️ Atenção:</strong> A exclusão da conta é permanente e irreversível. Todos os dados associados serão removidos conforme descrito abaixo.
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>Como solicitar a exclusão da sua conta</h2>
      <ol style={{ paddingLeft: 20 }}>
        <li style={{ marginBottom: 8 }}>Envie um e-mail para <a href="mailto:contato@gestaofc.com.br" style={{ color: '#4169E1' }}>contato@gestaofc.com.br</a> com o assunto <strong>"Solicitação de Exclusão de Conta"</strong></li>
        <li style={{ marginBottom: 8 }}>Informe o e-mail cadastrado na sua conta GestaoFC</li>
        <li style={{ marginBottom: 8 }}>Confirme sua identidade respondendo as perguntas de verificação que enviaremos</li>
        <li style={{ marginBottom: 8 }}>Sua solicitação será processada em até <strong>7 dias úteis</strong></li>
      </ol>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>O que é excluído</h2>
      <ul style={{ paddingLeft: 20 }}>
        <li style={{ marginBottom: 4 }}>Dados de perfil (nome, e-mail, telefone)</li>
        <li style={{ marginBottom: 4 }}>Dados de atletas cadastrados</li>
        <li style={{ marginBottom: 4 }}>Registros de presença e avaliações</li>
        <li style={{ marginBottom: 4 }}>Fotos e arquivos enviados</li>
        <li style={{ marginBottom: 4 }}>Configurações da academia</li>
        <li style={{ marginBottom: 4 }}>Acesso ao aplicativo</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>O que é retido temporariamente</h2>
      <p>Por exigência legal e fiscal, os seguintes dados são retidos por até <strong>5 anos</strong> após a exclusão:</p>
      <ul style={{ paddingLeft: 20 }}>
        <li style={{ marginBottom: 4 }}>Registros financeiros e comprovantes de pagamento</li>
        <li style={{ marginBottom: 4 }}>Contratos digitais assinados</li>
        <li style={{ marginBottom: 4 }}>Notas fiscais e recibos</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>Exclusão parcial de dados</h2>
      <p>Você também pode solicitar a exclusão de dados específicos sem excluir sua conta. Envie um e-mail para <a href="mailto:contato@gestaofc.com.br" style={{ color: '#4169E1' }}>contato@gestaofc.com.br</a> especificando quais dados deseja remover.</p>

      <div style={{ marginTop: 48, padding: '16px 20px', background: '#f5f5f5', borderRadius: 8, fontSize: 13, color: '#666' }}>
        <strong>Contato:</strong> contato@gestaofc.com.br<br />
        <strong>Responsável:</strong> Thales Cruz Salviano de Campos<br />
        <strong>GestaoFC</strong> — Iturama, Minas Gerais, Brasil
      </div>
    </div>
  )
}
