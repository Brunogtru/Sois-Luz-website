/* =============================================
   Sois Luz — admin-equipe.js
   Lógica de gerenciamento de membros da equipe (Restrito para Admins).
   ============================================= */

// Cache local de equipe
window.membrosEquipe = [];

// Inicia escutas e carrega dados
document.addEventListener('DOMContentLoaded', async () => {
  const perfil = await verificarSessao();
  if (!perfil) return;

  // Bloqueio extra no front: se for gerente, redireciona na hora
  if (perfil.nivel !== 'admin') {
    window.location.href = 'dashboard.html';
    return;
  }

  await carregarEquipe();
  inicializarRealtime();

  // Abre modal explicativo para novo membro
  document.getElementById('btn-convidar-membro').addEventListener('click', () => {
    abrirModalConvidar();
  });

  // Fechar modal
  document.getElementById('btn-fechar-modal').addEventListener('click', fecharModal);
  document.getElementById('equipe-modal').addEventListener('click', function (e) {
    if (e.target.id === 'equipe-modal') fecharModal();
  });
});

// Busca todos os membros cadastrados no admin_users
async function carregarEquipe() {
  try {
    const { data, error } = await db
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    window.membrosEquipe = data || [];

    // Atualiza contador no header
    document.getElementById('total-registros').textContent = `${window.membrosEquipe.length} membros na equipe`;

    renderizarEquipe(window.membrosEquipe);
    await recarregarBadgesSidebar();

  } catch (err) {
    console.error('Erro ao buscar colaboradores da equipe:', err);
  }
}

// Renderiza a lista de membros em cards elegantes
function renderizarEquipe(membros) {
  const grid = document.getElementById('equipe-grid');
  if (!grid) return;

  if (!membros.length) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-style: italic; padding: var(--space-8);">Nenhum membro cadastrado na equipe no momento.</div>';
    return;
  }

  grid.innerHTML = membros.map(m => {
    // Iniciais do avatar
    const iniciais = m.nome
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    // Status classes
    const statusClass = m.ativo ? 'badge--confirmado' : 'badge--passado';
    const statusTexto = m.ativo ? 'Ativo' : 'Inativo';

    // Nível classes
    const nivelClass = m.nivel === 'admin' ? 'badge--admin' : 'badge--gerente';
    const nivelTexto = m.nivel === 'admin' ? 'Admin' : 'Gerente';

    // Bloqueia ações no próprio perfil para evitar auto-exclusão acidental
    const ehOMesmoUsuario = m.id === window.adminUser?.id;
    let acoesHTML = '';

    if (!ehOMesmoUsuario) {
      const toggleStatusTexto = m.ativo ? 'Desativar' : 'Reativar';
      const toggleStatusClasse = m.ativo ? 'btn-cancelar' : 'btn-confirmar';
      const proximoNivel = m.nivel === 'admin' ? 'gerente' : 'admin';
      const proximoNivelTexto = m.nivel === 'admin' ? 'Tornar Gerente' : 'Tornar Admin';

      acoesHTML = `
        <div class="admin-membro-acoes">
          <button class="btn-secundario" onclick="alterarNivelMembro('${m.id}', '${proximoNivel}')">
            ${proximoNivelTexto}
          </button>
          <button class="btn-secundario ${toggleStatusClasse}" onclick="toggleStatusMembro('${m.id}', ${!m.ativo})">
            ${toggleStatusTexto}
          </button>
        </div>
      `;
    } else {
      acoesHTML = `
        <div class="admin-membro-bloqueado">
          Seu perfil (Edição bloqueada)
        </div>
      `;
    }

    return `
      <article class="admin-membro-card">
        <div class="admin-membro-avatar">${iniciais}</div>
        <h3 class="admin-membro-nome">${m.nome}</h3>
        <span class="admin-membro-email">${m.email}</span>
        <div class="admin-membro-badges">
          <span class="badge ${nivelClass}">${nivelTexto}</span>
          <span class="badge ${statusClass}">${statusTexto}</span>
        </div>
        ${acoesHTML}
      </article>
    `;
  }).join('');
}

// Abre o modal de convite
function abrirModalConvidar() {
  const modal = document.getElementById('equipe-modal');
  modal.classList.add('is-open');
}

// Fecha o modal
function fecharModal() {
  document.getElementById('equipe-modal').classList.remove('is-open');
}

// Alterna o status ativo do membro no Supabase
async function toggleStatusMembro(id, ativo) {
  try {
    const { error } = await db
      .from('admin_users')
      .update({ ativo })
      .eq('id', id);

    if (error) throw error;

    await carregarEquipe();

  } catch (err) {
    console.error('Erro ao alternar status do colaborador:', err);
    alert('Erro ao alternar status do colaborador.');
  }
}

// Altera o nível do membro entre admin e gerente
async function alterarNivelMembro(id, nivel) {
  try {
    const { error } = await db
      .from('admin_users')
      .update({ nivel })
      .eq('id', id);

    if (error) throw error;

    await carregarEquipe();

  } catch (err) {
    console.error('Erro ao alterar nível do colaborador:', err);
    alert('Erro ao alterar nível do colaborador.');
  }
}

// Recarrega contagem de pendentes e atualiza na sidebar
async function recarregarBadgesSidebar() {
  try {
    const [pedidosRes, inscricoesRes] = await Promise.all([
      db.from('pedidos').select('status'),
      db.from('inscricoes').select('status')
    ]);

    const pedPendentes = pedidosRes.data?.filter(p => p.status === 'pendente').length || 0;
    const insPendentes = inscricoesRes.data?.filter(i => i.status === 'pendente').length || 0;

    const badgePed = document.getElementById('badge-pedidos');
    const badgeIns = document.getElementById('badge-inscricoes');

    if (badgePed) {
      if (pedPendentes > 0) {
        badgePed.textContent = pedPendentes;
        badgePed.classList.remove('hidden');
      } else {
        badgePed.classList.add('hidden');
      }
    }

    if (badgeIns) {
      if (insPendentes > 0) {
        badgeIns.textContent = insPendentes;
        badgeIns.classList.remove('hidden');
      } else {
        badgeIns.classList.add('hidden');
      }
    }
  } catch (e) {
    console.error('Erro ao recarregar badges da sidebar:', e);
  }
}

// Inicializa a escuta Realtime para a tabela admin_users
function inicializarRealtime() {
  db.channel('realtime-equipe')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_users' }, () => {
      console.log('Atualização em tempo real (equipe)');
      carregarEquipe();
    })
    .subscribe();
}
