/* =============================================
   Sois Luz — admin-auth.js
   Gerenciamento de sessões, login, proteção de rotas e sidebar.
   ============================================= */

const PAGINAS_PROTEGIDAS = [
  'dashboard.html',
  'pedidos.html',
  'inscricoes.html',
  'eventos.html',
  'produtos.html',
  'equipe.html'
];

// Função de verificação de sessão e perfil administrativo
async function verificarSessao() {
  const pagina = window.location.pathname.split('/').pop() || 'index.html';
  const ehProtegida = PAGINAS_PROTEGIDAS.includes(pagina);

  const { data: { session } } = await db.auth.getSession();

  if (!session) {
    if (ehProtegida) {
      window.location.href = 'index.html';
    }
    return null;
  }

  // Se o usuário está autenticado e tenta acessar o login (index.html), vai para o dashboard
  if (pagina === 'index.html') {
    window.location.href = 'dashboard.html';
    return null;
  }

  // Busca o perfil do usuário na tabela admin_users
  const { data: perfil, error } = await db
    .from('admin_users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !perfil || !perfil.ativo) {
    console.error('Perfil administrativo inválido, inexistente ou inativo.');
    await db.auth.signOut();
    window.location.href = 'index.html';
    return null;
  }

  // Proteção extra para equipe.html (apenas admin pode acessar)
  if (pagina === 'equipe.html' && perfil.nivel !== 'admin') {
    window.location.href = 'dashboard.html';
    return null;
  }

  // Salva o perfil do usuário na variável global window
  window.adminUser = perfil;

  // Preenche dados do usuário na sidebar (aguarda renderização rápida do DOM)
  setTimeout(() => {
    preencherSidebar(perfil);
  }, 50);

  return perfil;
}

// Preenche dados e ajusta links da sidebar
function preencherSidebar(perfil) {
  const avatarEl = document.getElementById('admin-avatar');
  const nomeEl = document.getElementById('admin-nome');
  const nivelEl = document.getElementById('admin-nivel');
  const menuEquipe = document.getElementById('menu-equipe');
  const logoutBtn = document.getElementById('btn-logout');

  // Define as iniciais do usuário para o avatar
  if (avatarEl) {
    avatarEl.textContent = perfil.nome
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  if (nomeEl) {
    nomeEl.textContent = perfil.nome;
  }

  if (nivelEl) {
    nivelEl.textContent = perfil.nivel === 'admin' ? 'Administradora' : 'Gerente';
  }

  // Se for gerente, remove fisicamente o menu Equipe da sidebar
  if (perfil.nivel !== 'admin' && menuEquipe) {
    menuEquipe.remove();
  }

  // Bind do botão de logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', adminLogout);
  }
}

// Logout Administrativo
async function adminLogout() {
  await db.auth.signOut();
  window.location.href = 'index.html';
}

// Execução automática imediata de validação de rota
verificarSessao();
