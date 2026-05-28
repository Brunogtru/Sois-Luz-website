/* =============================================
   Sois Luz — admin-pedidos.js
   Lógica de gerenciamento de pedidos com suporte a tempo real.
   ============================================= */

let currentFiltroStatus = '';
let currentTermoBusca = '';
window.pedidosCache = {};

// Função auxiliar para formatar a data
function formatarDataCompleta(dataStr) {
  if (!dataStr) return '—';
  const d = new Date(dataStr);
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} às ${hora}`;
}

// Inicia escutas e carrega dados ao abrir a página
document.addEventListener('DOMContentLoaded', async () => {
  const perfil = await verificarSessao();
  if (!perfil) return;

  await carregarPedidos(currentFiltroStatus, currentTermoBusca);
  inicializarRealtime();

  // Escuta filtros por botões de status
  document.querySelectorAll('.admin-filtro-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.admin-filtro-btn').forEach(b => b.classList.remove('ativo'));
      this.classList.add('ativo');
      currentFiltroStatus = this.getAttribute('data-status');
      carregarPedidos(currentFiltroStatus, currentTermoBusca);
    });
  });

  // Escuta busca textual
  document.getElementById('busca-input').addEventListener('input', function () {
    currentTermoBusca = this.value.trim();
    carregarPedidos(currentFiltroStatus, currentTermoBusca);
  });

  // Fechamento de modal
  document.getElementById('btn-fechar-modal').addEventListener('click', fecharModal);
  document.getElementById('pedido-modal').addEventListener('click', function (e) {
    if (e.target.id === 'pedido-modal') fecharModal();
  });
});

// Carrega pedidos e atualiza estatísticas da sidebar
async function carregarPedidos(filtroStatus = '', termoBusca = '') {
  try {
    let query = db
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (filtroStatus) {
      query = query.eq('status', filtroStatus);
    }

    const { data, error } = await query;
    if (error) throw error;

    let pedidos = data || [];

    // Filtro de busca local por nome ou email
    if (termoBusca) {
      const termo = termoBusca.toLowerCase();
      pedidos = pedidos.filter(p =>
        (p.nome && p.nome.toLowerCase().includes(termo)) ||
        (p.email && p.email.toLowerCase().includes(termo))
      );
    }

    // Alimenta cache global
    pedidos.forEach(p => {
      window.pedidosCache[p.id] = p;
    });

    // Atualiza contador de registros no header
    document.getElementById('total-registros').textContent = `${pedidos.length} pedidos`;

    renderizarPedidos(pedidos);
    await recarregarBadgesSidebar();

  } catch (err) {
    console.error('Erro ao carregar pedidos:', err);
  }
}

// Renderiza linhas da tabela de pedidos
function renderizarPedidos(pedidos) {
  const tbody = document.getElementById('pedidos-tbody');
  if (!tbody) return;

  if (!pedidos.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="admin-table__empty">Nenhum pedido encontrado.</td></tr>';
    return;
  }

  tbody.innerHTML = pedidos.map(p => {
    // Formata o resumo dos produtos do carrinho
    let itemTexto = 'Nenhum';
    try {
      const itens = JSON.parse(p.itens || '[]');
      if (itens.length > 0) {
        itemTexto = itens[0].nome;
        if (itens.length > 1) {
          itemTexto += ` + ${itens.length - 1}`;
        }
      }
    } catch (e) {
      console.error('Erro no parse dos itens:', e);
    }

    // Ações dinâmicas de acordo com o nível do usuário
    let acoesHTML = '';
    const nivel = window.adminUser?.nivel;

    if (nivel === 'admin') {
      acoesHTML = `
        <select class="admin-select" onchange="atualizarStatusPedido('${p.id}', this.value)">
          <option value="">Status</option>
          <option value="pendente" ${p.status === 'pendente' ? 'selected' : ''}>Pendente</option>
          <option value="aprovado" ${p.status === 'aprovado' ? 'selected' : ''}>Aprovado</option>
          <option value="enviado" ${p.status === 'enviado' ? 'selected' : ''}>Enviado</option>
          <option value="cancelado" ${p.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
        </select>
      `;
    } else if (nivel === 'gerente') {
      // Gerente pode apenas alterar para "enviado"
      if (p.status !== 'enviado' && p.status !== 'cancelado') {
        acoesHTML = `
          <button class="btn-secundario btn-confirmar" onclick="atualizarStatusPedido('${p.id}', 'enviado')">
            Confirmar Envio
          </button>
        `;
      } else {
        acoesHTML = `<span style="font-size: var(--fs-xs); color: var(--text-muted);">Ação indisponível</span>`;
      }
    }

    return `
      <tr class="admin-table__row">
        <td>
          <div class="admin-table-cliente">
            <span class="admin-table-cliente__nome">${p.nome || '—'}</span>
            <span class="admin-table-cliente__email">${p.email || '—'}</span>
          </div>
        </td>
        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${itemTexto}</td>
        <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><small>${p.endereco || '—'}</small></td>
        <td><strong>R$ ${Number(p.total).toFixed(2).replace('.', ',')}</strong></td>
        <td><span class="badge badge--${p.status}">${p.status}</span></td>
        <td>${formatarDataCompleta(p.created_at).split(' às ')[0]}</td>
        <td>
          <div style="display: flex; gap: var(--space-2); align-items: center;">
            <button class="btn-secundario" onclick="abrirDetalhesPedido('${p.id}')">Ver</button>
            ${acoesHTML}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Atualiza o status do pedido no Supabase
async function atualizarStatusPedido(id, novoStatus) {
  if (!novoStatus) return;

  try {
    const { error } = await db
      .from('pedidos')
      .update({ status: novoStatus })
      .eq('id', id);

    if (error) throw error;

    // Atualiza modal se estiver aberto
    const modal = document.getElementById('pedido-modal');
    if (modal.classList.contains('is-open')) {
      const statusBadge = document.getElementById('modal-status');
      if (statusBadge) {
        statusBadge.className = `badge badge--${novoStatus}`;
        statusBadge.textContent = novoStatus;
      }
    }

    await carregarPedidos(currentFiltroStatus, currentTermoBusca);

  } catch (err) {
    console.error('Erro ao atualizar status do pedido:', err);
    alert('Erro ao atualizar status do pedido.');
  }
}

// Abre o modal de detalhes do pedido
function abrirDetalhesPedido(id) {
  const p = window.pedidosCache[id];
  if (!p) return;

  document.getElementById('modal-pedido-id').textContent = p.id;
  document.getElementById('modal-nome').textContent = p.nome || '—';
  document.getElementById('modal-whatsapp').textContent = p.telefone || '—';
  document.getElementById('modal-email').textContent = p.email || '—';
  document.getElementById('modal-endereco').textContent = p.endereco || '—';

  // Renderiza itens do pedido no modal
  let itens = [];
  try {
    itens = JSON.parse(p.itens || '[]');
  } catch (e) {
    console.error('Erro ao converter itens do pedido:', e);
  }

  const itemsContainer = document.getElementById('modal-itens');
  if (!itens.length) {
    itemsContainer.innerHTML = '<span style="color:var(--text-muted);font-style:italic;font-size:var(--fs-xs);">Nenhum item cadastrado neste pedido.</span>';
  } else {
    itemsContainer.innerHTML = itens.map(i => `
      <div class="item-mini">
        <img class="item-mini__thumb" src="${i.imagem_url || '../assets/produto-kit.jpg'}" alt="${i.nome}">
        <div class="item-mini__info">
          <span class="item-mini__nome">${i.nome}</span>
          <span class="item-mini__detalhes">Quantidade: ${i.quantidade} &bull; R$ ${Number(i.preco).toFixed(2).replace('.', ',')} cada</span>
        </div>
        <span style="font-weight: var(--fw-semibold); font-size: var(--fs-sm); margin-left: auto;">R$ ${(Number(i.preco) * Number(i.quantidade)).toFixed(2).replace('.', ',')}</span>
      </div>
    `).join('');
  }

  document.getElementById('modal-total').textContent = `R$ ${Number(p.total).toFixed(2).replace('.', ',')}`;

  const statusBadge = document.getElementById('modal-status');
  statusBadge.className = `badge badge--${p.status}`;
  statusBadge.textContent = p.status;

  document.getElementById('modal-data').textContent = formatarDataCompleta(p.created_at);
  document.getElementById('modal-mp-id').textContent = p.mp_preference || '—';

  const modal = document.getElementById('pedido-modal');
  modal.classList.add('is-open');
}

// Fecha o modal de detalhes do pedido
function fecharModal() {
  document.getElementById('pedido-modal').classList.remove('is-open');
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

// Inicializa a escuta de alterações em tempo real no banco
function inicializarRealtime() {
  db.channel('realtime-pedidos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
      console.log('Atualização em tempo real (pedidos)');
      carregarPedidos(currentFiltroStatus, currentTermoBusca);
    })
    .subscribe();
}
