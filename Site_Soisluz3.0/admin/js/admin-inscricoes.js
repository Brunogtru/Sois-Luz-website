/* =============================================
   Sois Luz — admin-inscricoes.js
   Lógica de gerenciamento de inscrições com suporte a tempo real.
   ============================================= */

let currentFiltroStatus = '';
let currentFiltroEvento = '';
let currentTermoBusca = '';
window.eventosCache = {};

// Função auxiliar para formatar a data
function formatarDataInscricao(dataStr) {
  if (!dataStr) return '—';
  const d = new Date(dataStr);
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} às ${hora}`;
}

// Inicia escutas e carrega dados
document.addEventListener('DOMContentLoaded', async () => {
  const perfil = await verificarSessao();
  if (!perfil) return;

  await carregarFiltroEventos();
  await carregarInscricoes(currentFiltroStatus, currentFiltroEvento, currentTermoBusca);
  inicializarRealtime();

  // Escuta filtros por botões de status
  document.querySelectorAll('.admin-filtro-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.admin-filtro-btn').forEach(b => b.classList.remove('ativo'));
      this.classList.add('ativo');
      currentFiltroStatus = this.getAttribute('data-status');
      carregarInscricoes(currentFiltroStatus, currentFiltroEvento, currentTermoBusca);
    });
  });

  // Escuta filtro dropdown por Encontro
  document.getElementById('filtro-evento').addEventListener('change', function () {
    currentFiltroEvento = this.value;
    carregarInscricoes(currentFiltroStatus, currentFiltroEvento, currentTermoBusca);
  });

  // Escuta busca textual
  document.getElementById('busca-input').addEventListener('input', function () {
    currentTermoBusca = this.value.trim();
    carregarInscricoes(currentFiltroStatus, currentFiltroEvento, currentTermoBusca);
  });
});

// Carrega a lista de eventos para o dropdown de filtro
async function carregarFiltroEventos() {
  try {
    const { data, error } = await db
      .from('eventos')
      .select('id, nome')
      .order('data_evento', { ascending: false });

    if (error) throw error;

    const select = document.getElementById('filtro-evento');
    if (!select) return;

    // Reseta select
    select.innerHTML = '<option value="">Todos os Encontros</option>';

    if (data && data.length > 0) {
      data.forEach(e => {
        window.eventosCache[e.id] = e.nome;
        const opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = e.nome;
        select.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Erro ao popular filtro de eventos:', err);
  }
}

// Carrega as inscrições com suporte a joins
async function carregarInscricoes(filtroStatus = '', filtroEvento = '', termoBusca = '') {
  try {
    const { data, error } = await db
      .from('inscricoes')
      .select(`
        *,
        eventos (
          id,
          nome,
          data_evento,
          gratuito,
          preco
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    let inscricoes = data || [];

    // 1. Filtragem reativa local
    if (filtroStatus) {
      inscricoes = inscricoes.filter(i => i.status === filtroStatus);
    }

    if (filtroEvento) {
      inscricoes = inscricoes.filter(i => i.evento_id === filtroEvento);
    }

    if (termoBusca) {
      const termo = termoBusca.toLowerCase();
      inscricoes = inscricoes.filter(i =>
        (i.nome && i.nome.toLowerCase().includes(termo)) ||
        (i.email && i.email.toLowerCase().includes(termo))
      );
    }

    // 2. Atualizar cards de estatísticas no topo da tela
    atualizarStatsInscricoes(inscricoes);

    // 3. Renderizar Tabela
    renderizarInscricoes(inscricoes);

    // 4. Recarregar badges da sidebar
    await recarregarBadgesSidebar();

  } catch (err) {
    console.error('Erro ao buscar inscrições:', err);
  }
}

// Calcula e preenche as estatísticas nos cards no topo da tela
function atualizarStatsInscricoes(inscricoes) {
  const total = inscricoes.length;
  const confirmadas = inscricoes.filter(i => i.status === 'confirmado').length;
  const pendentes = inscricoes.filter(i => i.status === 'pendente').length;
  const canceladas = inscricoes.filter(i => i.status === 'cancelado').length;

  const els = {
    total: document.getElementById('stat-total'),
    confirmadas: document.getElementById('stat-confirmadas'),
    pendentes: document.getElementById('stat-pendentes'),
    canceladas: document.getElementById('stat-canceladas'),
    totalRegistros: document.getElementById('total-registros')
  };

  if (els.total) els.total.textContent = total;
  if (els.confirmadas) els.confirmadas.textContent = confirmadas;
  if (els.pendentes) els.pendentes.textContent = pendentes;
  if (els.canceladas) els.canceladas.textContent = canceladas;
  if (els.totalRegistros) els.totalRegistros.textContent = `${total} inscrições registradas`;
}

// Renderiza a listagem de inscrições na tabela
function renderizarInscricoes(inscricoes) {
  const tbody = document.getElementById('inscricoes-tbody');
  if (!tbody) return;

  if (!inscricoes.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="admin-table__empty">Nenhuma inscrição encontrada.</td></tr>';
    return;
  }

  tbody.innerHTML = inscricoes.map(i => {
    // Formata o link direto para o WhatsApp do participante
    const cleanWpp = i.telefone ? i.telefone.replace(/\D/g, '') : '';
    const whatsappHTML = cleanWpp
      ? `<strong>${i.telefone}</strong><br><a href="https://wa.me/55${cleanWpp}" target="_blank" class="btn-secundario" style="padding: 1px var(--space-2); font-size: 10px; display: inline-flex; margin-top: 4px; text-decoration: none;">WhatsApp ↗</a>`
      : i.telefone || '—';

    // Nome e tipo do evento
    const evento = i.eventos;
    const eventoNome = evento ? evento.nome : 'Evento Desconhecido';
    
    let tipoEventoHTML = '—';
    if (evento) {
      tipoEventoHTML = evento.gratuito
        ? '<span style="color:#2d6a2d; font-weight:var(--fw-medium);">Gratuito</span>'
        : `<span style="font-weight:var(--fw-semibold);">R$ ${Number(evento.preco).toFixed(2).replace('.', ',')}</span>`;
    }

    // Ações para alterar status
    let acoesHTML = '';
    if (i.status === 'pendente') {
      acoesHTML = `
        <button class="btn-secundario btn-confirmar" onclick="atualizarStatusInscricao('${i.id}', 'confirmado')">Confirmar</button>
        <button class="btn-secundario btn-cancelar" onclick="atualizarStatusInscricao('${i.id}', 'cancelado')">Cancelar</button>
      `;
    } else if (i.status === 'confirmado') {
      acoesHTML = `
        <button class="btn-secundario btn-cancelar" onclick="atualizarStatusInscricao('${i.id}', 'cancelado')">Cancelar</button>
      `;
    } else if (i.status === 'cancelado') {
      acoesHTML = `
        <button class="btn-secundario btn-confirmar" onclick="atualizarStatusInscricao('${i.id}', 'confirmado')">Confirmar</button>
      `;
    }

    return `
      <tr class="admin-table__row">
        <td>${formatarDataInscricao(i.created_at).split(' às ')[0]}</td>
        <td>
          <div class="admin-table-cliente">
            <span class="admin-table-cliente__nome">${i.nome}</span>
            <span class="admin-table-cliente__email">${i.email}</span>
          </div>
        </td>
        <td>${whatsappHTML}</td>
        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${eventoNome}</td>
        <td>${tipoEventoHTML}</td>
        <td><span class="badge badge--${i.status}">${i.status}</span></td>
        <td>
          <div style="display: flex; gap: var(--space-2); align-items: center;">
            ${acoesHTML}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Atualiza o status da inscrição no Supabase
async function atualizarStatusInscricao(id, novoStatus) {
  try {
    const { error } = await db
      .from('inscricoes')
      .update({ status: novoStatus })
      .eq('id', id);

    if (error) throw error;

    await carregarInscricoes(currentFiltroStatus, currentFiltroEvento, currentTermoBusca);

  } catch (err) {
    console.error('Erro ao atualizar inscrição:', err);
    alert('Erro ao atualizar status da inscrição.');
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

// Inicializa a escuta em tempo real para a tabela inscricoes
function inicializarRealtime() {
  db.channel('realtime-inscricoes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inscricoes' }, () => {
      console.log('Atualização em tempo real (inscrições)');
      carregarInscricoes(currentFiltroStatus, currentFiltroEvento, currentTermoBusca);
    })
    .subscribe();
}
