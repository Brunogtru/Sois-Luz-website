/* =============================================
   Sois Luz — admin-eventos.js
   Lógica de gerenciamento de encontros/eventos com tempo real.
   ============================================= */

// Cache de eventos local
window.eventosLocais = [];

// Função auxiliar para formatar a data
function formatarDataEncontro(dataStr) {
  if (!dataStr) return '—';
  const d = new Date(dataStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

// Inicia escutas e carrega dados
document.addEventListener('DOMContentLoaded', async () => {
  const perfil = await verificarSessao();
  if (!perfil) return;

  await carregarEventos();
  inicializarRealtime();

  // Abre modal para novo evento
  document.getElementById('btn-novo-evento').addEventListener('click', () => {
    abrirModalForm();
  });

  // Fechar modal
  document.getElementById('btn-fechar-modal').addEventListener('click', fecharModal);
  document.getElementById('evento-modal').addEventListener('click', function (e) {
    if (e.target.id === 'evento-modal') fecharModal();
  });

  // Toggle do switch gratuito
  document.getElementById('evento-gratuito').addEventListener('change', function () {
    const grupoPreco = document.getElementById('grupo-preco');
    if (grupoPreco) {
      grupoPreco.style.display = this.checked ? 'none' : 'block';
    }
  });

  // Submissão do formulário de evento (Criação/Edição)
  document.getElementById('form-evento').addEventListener('submit', async function (e) {
    e.preventDefault();

    const id = document.getElementById('evento-id').value;
    const nome = document.getElementById('evento-nome').value.trim();
    const descricao = document.getElementById('evento-desc').value.trim();
    const data_evento = document.getElementById('evento-data').value;
    const horario = document.getElementById('evento-horario').value.trim();
    const local = document.getElementById('evento-local').value.trim();
    const vagas = document.getElementById('evento-vagas').value ? Number(document.getElementById('evento-vagas').value) : null;
    const gratuito = document.getElementById('evento-gratuito').checked;
    const preco = gratuito ? 0 : Number(document.getElementById('evento-preco').value);
    const imagem_url = document.getElementById('evento-imagem').value.trim();
    const status = document.getElementById('evento-status').value;

    if (!nome || !data_evento || !horario || !local) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const payload = {
      nome,
      descricao,
      data_evento,
      horario,
      local,
      vagas,
      gratuito,
      preco,
      imagem_url: imagem_url || null,
      status
    };

    try {
      if (id) {
        // Modo Edição
        const { error } = await db
          .from('eventos')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
      } else {
        // Modo Criação
        const { error } = await db
          .from('eventos')
          .insert(payload);

        if (error) throw error;
      }

      fecharModal();
      await carregarEventos();

    } catch (err) {
      console.error('Erro ao salvar encontro:', err);
      alert('Erro ao salvar encontro. Verifique os dados e tente novamente.');
    }
  });
});

// Busca os encontros e realiza join para trazer count de inscrições
async function carregarEventos() {
  try {
    // Busca eventos e o count de inscrições correspondentes
    const { data, error } = await db
      .from('eventos')
      .select('*, inscricoes(count)')
      .order('data_evento', { ascending: false });

    if (error) throw error;

    window.eventosLocais = data || [];

    // Atualiza contador de registros no header
    document.getElementById('total-registros').textContent = `${window.eventosLocais.length} encontros registrados`;

    renderizarEventos(window.eventosLocais);
    await recarregarBadgesSidebar();

  } catch (err) {
    console.error('Erro ao buscar eventos:', err);
  }
}

// Renderiza os cards de eventos
function renderizarEventos(eventos) {
  const grid = document.getElementById('eventos-grid');
  if (!grid) return;

  if (!eventos.length) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-style: italic; padding: var(--space-8);">Nenhum encontro agendado ou arquivado no momento.</div>';
    return;
  }

  grid.innerHTML = eventos.map(e => {
    // Obtém o count de inscrições filtrando pela coluna aggregate do Join
    const inscricoesCount = e.inscricoes && e.inscricoes.length > 0 ? e.inscricoes[0].count : 0;
    
    // Status text e badge
    const badgeStatusClass = e.status === 'proximo' ? 'badge--proximo' : 'badge--passado';
    const badgeStatusTexto = e.status === 'proximo' ? 'Próximo' : 'Passado';

    // Preço ou gratuidade
    const precoTexto = e.gratuito
      ? '<span style="color:#166534;">✦ Gratuito</span>'
      : `R$ ${Number(e.preco).toFixed(2).replace('.', ',')}`;

    // Ações rápidas baseadas no status
    let btnArquivarHTML = '';
    if (e.status === 'proximo') {
      btnArquivarHTML = `
        <button class="btn-secundario btn-cancelar" onclick="arquivarEvento('${e.id}')">
          Arquivar
        </button>
      `;
    }

    return `
      <article class="admin-evento-card">
        <img class="admin-evento-card__img" src="${e.imagem_url || '../assets/evento-capa.jpg'}" alt="${e.nome}">
        <div class="admin-evento-card__body">
          <div class="admin-evento-card__header">
            <h3 class="admin-evento-card__nome">${e.nome}</h3>
            <span class="badge ${badgeStatusClass}">${badgeStatusTexto}</span>
          </div>
          
          <div class="admin-evento-card__infos">
            <div class="admin-evento-card__info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>${formatarDataEncontro(e.data_evento)} &bull; ${e.horario}</span>
            </div>
            <div class="admin-evento-card__info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>${e.local || 'Suzano, SP'}</span>
            </div>
            <div class="admin-evento-card__info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <span><strong>${inscricoesCount}</strong> de ${e.vagas || 'Sem limite'} vagas preenchidas</span>
            </div>
          </div>

          <p class="admin-evento-card__info" style="font-weight: 300; margin-top: var(--space-2); line-height: 1.4;">${e.descricao || 'Nenhuma descrição fornecida.'}</p>

          <div class="admin-evento-card__footer">
            <span class="admin-evento-card__inscritos" style="font-weight: 600; color: var(--text-primary); font-size: var(--fs-sm);">${precoTexto}</span>
            <div class="admin-evento-card__acoes">
              <button class="btn-secundario" onclick="abrirModalForm('${e.id}')">Editar</button>
              ${btnArquivarHTML}
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Abre o formulário do modal em modo de Criação ou Edição
function abrirModalForm(id = null) {
  const form = document.getElementById('form-evento');
  if (!form) return;

  form.reset();

  const tituloEl = document.getElementById('modal-titulo');
  const precoGrupo = document.getElementById('grupo-preco');

  if (id) {
    // MODO EDIÇÃO
    const e = window.eventosLocais.find(item => item.id === id);
    if (!e) return;

    tituloEl.textContent = 'Editar Encontro';
    document.getElementById('evento-id').value = e.id;
    document.getElementById('evento-nome').value = e.nome;
    document.getElementById('evento-desc').value = e.descricao || '';
    document.getElementById('evento-data').value = e.data_evento;
    document.getElementById('evento-horario').value = e.horario;
    document.getElementById('evento-local').value = e.local;
    document.getElementById('evento-vagas').value = e.vagas || '';
    document.getElementById('evento-gratuito').checked = e.gratuito;
    document.getElementById('evento-preco').value = e.preco || '';
    document.getElementById('evento-imagem').value = e.imagem_url || '';
    document.getElementById('evento-status').value = e.status;

    if (precoGrupo) {
      precoGrupo.style.display = e.gratuito ? 'none' : 'block';
    }

  } else {
    // MODO CRIAÇÃO
    tituloEl.textContent = 'Novo Encontro';
    document.getElementById('evento-id').value = '';
    document.getElementById('evento-gratuito').checked = true;
    if (precoGrupo) {
      precoGrupo.style.display = 'none';
    }
  }

  const modal = document.getElementById('evento-modal');
  modal.classList.add('is-open');
}

// Fecha o modal do formulário
function fecharModal() {
  document.getElementById('evento-modal').classList.remove('is-open');
}

// Modifica rapidamente o status do evento para passado (Arquivar)
async function arquivarEvento(id) {
  if (!confirm('Deseja realmente arquivar este encontro? Ele será movido para o histórico.')) return;

  try {
    const { error } = await db
      .from('eventos')
      .update({ status: 'passado' })
      .eq('id', id);

    if (error) throw error;

    await carregarEventos();

  } catch (err) {
    console.error('Erro ao arquivar encontro:', err);
    alert('Erro ao arquivar encontro.');
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

// Inicializa escuta Realtime para a tabela de eventos
function inicializarRealtime() {
  db.channel('realtime-eventos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, () => {
      console.log('Atualização em tempo real (eventos)');
      carregarEventos();
    })
    .subscribe();
}
