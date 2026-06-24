export default function PrivacidadePage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', fontFamily: 'Inter, sans-serif', color: '#1a1a1a', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Política de Privacidade</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Última atualização: 24 de junho de 2026</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 8 }}>1. Informações que coletamos</h2>
      <p>O GestaoFC coleta informações fornecidas diretamente pelos usuários, incluindo nome, e-mail, telefone, dados de atletas matriculados e informações financeiras necessárias para a gestão da academia esportiva.</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 8 }}>2. Como usamos as informações</h2>
      <p>As informações coletadas são utilizadas exclusivamente para:</p>
      <ul style={{ paddingLeft: 20 }}>
        <li>Gerenciar matrículas e atletas da academia</li>
        <li>Processar pagamentos de mensalidades</li>
        <li>Enviar comunicados e notificações via WhatsApp</li>
        <li>Gerar relatórios e estatísticas de desempenho</li>
        <li>Melhorar os serviços oferecidos pela plataforma</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 8 }}>3. Compartilhamento de dados</h2>
      <p>Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto:</p>
      <ul style={{ paddingLeft: 20 }}>
        <li>Processadores de pagamento (Asaas) para cobranças via PIX e cartão</li>
        <li>Serviços de mensageria (WhatsApp/Evolution API) para comunicação</li>
        <li>Serviços de autenticação (Clerk) para segurança de acesso</li>
        <li>Quando exigido por lei ou ordem judicial</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 8 }}>4. Armazenamento e segurança</h2>
      <p>Os dados são armazenados em servidores seguros (Supabase) com criptografia em trânsito e em repouso. Implementamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado.</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 8 }}>5. Direitos do usuário</h2>
      <p>Em conformidade com a LGPD (Lei Geral de Proteção de Dados), você tem direito a:</p>
      <ul style={{ paddingLeft: 20 }}>
        <li>Acessar seus dados pessoais</li>
        <li>Corrigir dados incompletos ou desatualizados</li>
        <li>Solicitar a exclusão de seus dados</li>
        <li>Portabilidade dos dados</li>
        <li>Revogar o consentimento a qualquer momento</li>
      </ul>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 8 }}>6. Dados de menores</h2>
      <p>O GestaoFC gerencia dados de atletas menores de idade com responsabilidade especial. O cadastro de menores requer autorização expressa do responsável legal, que assina contrato digital no momento da matrícula.</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 8 }}>7. Cookies e dados de uso</h2>
      <p>Utilizamos cookies essenciais para autenticação e funcionamento da plataforma. Não utilizamos cookies de rastreamento publicitário.</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 8 }}>8. Retenção de dados</h2>
      <p>Os dados são mantidos enquanto a conta estiver ativa. Após o encerramento, os dados são retidos por até 5 anos para cumprimento de obrigações legais e fiscais, sendo excluídos após esse prazo.</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 8 }}>9. Alterações nesta política</h2>
      <p>Esta política pode ser atualizada periodicamente. Notificaremos os usuários sobre mudanças significativas por e-mail ou através da plataforma.</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 8 }}>10. Contato</h2>
      <p>Para exercer seus direitos ou esclarecer dúvidas sobre privacidade:</p>
      <ul style={{ paddingLeft: 20 }}>
        <li>E-mail: <a href="mailto:contato@gestaofc.com.br" style={{ color: '#4169E1' }}>contato@gestaofc.com.br</a></li>
        <li>WhatsApp: (34) 99999-9999</li>
        <li>Responsável: Thales Cruz Salviano de Campos</li>
      </ul>

      <div style={{ marginTop: 48, padding: '16px 20px', background: '#f5f5f5', borderRadius: 8, fontSize: 13, color: '#666' }}>
        <strong>GestaoFC</strong> — Plataforma de Gestão para Academias de Futebol<br />
        CNPJ: a informar | Iturama, Minas Gerais, Brasil
      </div>
    </div>
  )
}
