/* =============================================
   Sois Luz — admin-dashboard.js
   Lógica e cálculos do Dashboard Geral do painel.
   ============================================= */

// Função auxiliar para formatar datas no formato pt-BR
function formatarData(dataStr) {
  if (!dataStr) return '';
  const d = new Date(dataStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Inicia o carregamento quando o DOM e a sessão estiverem prontos
document.addEventListener('DOMContentLoaded', async () => {
  const perfil = await verificarSessao();
  if (!perfil) return;

  await carregarDashboard();
});

// Busca os dados das tabelas e calcula as estatísticas
async function carregarDashboard() {
  try {
    const [pedidosRes, inscricoesRes, eventosRes] = await Promise.all([
      db.from('pedidos').select('*').order('created_at', { ascending: false }),
      db.from('inscricoes').select('*, eventos(nome)').order('created_at', { ascending: false }),
      db.from('eventos').select('*').eq('status', 'proximo').order('data_evento', { ascending: true }).limit(3)
    ]);

    if (pedidosRes.error) throw pedidosRes.error;
    if (inscricoesRes.error) throw inscricoesRes.error;
    if (eventosRes.error) throw eventosRes.error;

    const pedidos = pedidosRes.data || [];
    const inscricoes = inscricoesRes.data || [];
    const eventosProximos = eventosRes.data || [];

    // 1. Cálculos de Estatísticas (Métricas)
    const totalPedidos = pedidos.length;
    const pedidosAprovados = pedidos.filter(p => p.status === 'aprovado');
    const totalPedidosAprovados = pedidosAprovados.length;
    const totalInscricoes = inscricoes.length;

    // Receita acumulada (apenas aprovados)
    const receitaAcumulada = pedidosAprovados.reduce((acc, p) => acc + Number(p.total || 0), 0);

    // Receita pendente (status = pendente)
    const receitaPendente = pedidos
      .filter(p => p.status === 'pendente')
      .reduce((acc, p) => acc + Number(p.total || 0), 0);

    // Preenche as métricas nos elementos do HTML
    const els = {
      totalPedidos: document.getElementById('stat-total-pedidos'),
      aprovados: document.getElementById('stat-aprovados'),
      inscricoes: document.getElementById('stat-inscricoes'),
      receita: document.getElementById('stat-receita'),
      receitaTotal: document.getElementById('stat-receita-total'),
      pendente: document.getElementById('stat-pendente')
    };

    if (els.totalPedidos) els.totalPedidos.textContent = totalPedidos;
    if (els.aprovados) els.aprovados.textContent = totalPedidosAprovados;
    if (els.inscricoes) els.inscricoes.textContent = totalInscricoes;
    if (els.receita) els.receita.textContent = `R$ ${receitaAcumulada.toFixed(2).replace('.', ',')}`;
    if (els.receitaTotal) els.receitaTotal.textContent = `R$ ${receitaAcumulada.toFixed(2).replace('.', ',')}`;
    if (els.pendente) els.pendente.textContent = `R$ ${receitaPendente.toFixed(2).replace('.', ',')}`;

    // 2. Renderizar Listas Recentes (máximo 5)
    renderizarPedidosRecentes(pedidos.slice(0, 5));
    renderizarInscricoesRecentes(inscricoes.slice(0, 5));

    // 3. Renderizar Próximos Eventos
    renderizarProximosEventos(eventosProximos, inscricoes);

    // 4. Renderizar Gráfico Financeiro
    renderizarGrafico(pedidos);

    // 5. Atualizar Badges de Pendentes na Sidebar
    const pedPendentes = pedidos.filter(p => p.status === 'pendente').length;
    const insPendentes = inscricoes.filter(i => i.status === 'pendente').length;
    atualizarBadgesSidebar(pedPendentes, insPendentes);

  } catch (err) {
    console.error('Erro ao carregar dados do dashboard:', err);
  }
}

// Renderiza a lista de pedidos recentes na tabela
function renderizarPedidosRecentes(pedidos) {
  const tbody = document.getElementById('pedidos-tbody');
  if (!tbody) return;

  if (!pedidos.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="admin-table__empty">Nenhum pedido recente.</td></tr>';
    return;
  }

  tbody.innerHTML = pedidos.map(p => {
    // Formata produto(s) comprado(s)
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
      console.error('Erro ao fazer parse dos itens:', e);
    }

    return `
      <tr class="admin-table__row">
        <td>
          <div class="admin-table-cliente">
            <span class="admin-table-cliente__nome">${p.nome}</span>
            <span class="admin-table-cliente__email">${p.email}</span>
          </div>
        </td>
        <td>${itemTexto}</td>
        <td><strong>R$ ${Number(p.total).toFixed(2).replace('.', ',')}</strong></td>
        <td><span class="badge badge--${p.status}">${p.status}</span></td>
        <td>${formatarData(p.created_at)}</td>
      </tr>
    `;
  }).join('');
}

// Renderiza a lista de inscrições recentes na tabela
function renderizarInscricoesRecentes(inscricoes) {
  const tbody = document.getElementById('inscricoes-tbody');
  if (!tbody) return;

  if (!inscricoes.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="admin-table__empty">Nenhuma inscrição recente.</td></tr>';
    return;
  }

  tbody.innerHTML = inscricoes.map(i => {
    const nomeEvento = i.eventos ? i.eventos.nome : 'Evento Desconhecido';
    return `
      <tr class="admin-table__row">
        <td>
          <div class="admin-table-cliente">
            <span class="admin-table-cliente__nome">${i.nome}</span>
            <span class="admin-table-cliente__email">${i.email}</span>
          </div>
        </td>
        <td>${i.telefone || 'Não informado'}</td>
        <td>${nomeEvento}</td>
        <td><span class="badge badge--${i.status}">${i.status}</span></td>
        <td>${formatarData(i.created_at)}</td>
      </tr>
    `;
  }).join('');
}

// Renderiza a lista dos próximos 3 encontros
function renderizarProximosEventos(eventos, inscricoes) {
  const listaEl = document.getElementById('eventos-lista');
  if (!listaEl) return;

  if (!eventos.length) {
    listaEl.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-style: italic; padding: var(--space-4);">Nenhum encontro agendado no momento.</div>';
    return;
  }

  listaEl.innerHTML = eventos.map(e => {
    // Conta quantos participantes estão confirmados ou pendentes para este evento
    const totalInscritos = inscricoes.filter(i => i.evento_id === e.id && i.status !== 'cancelado').length;

    return `
      <div class="admin-proximo-item">
        <div class="admin-proximo-item__nome">${e.nome}</div>
        <div class="admin-proximo-item__info">${formatarData(e.data_evento)} &bull; ${e.local || 'Suzano, SP'}</div>
        <div class="admin-proximo-item__footer">
          <div class="admin-proximo-item__inscritos">${totalInscritos} inscritas</div>
          <a href="eventos.html" class="admin-card__link">Detalhes</a>
        </div>
      </div>
    `;
  }).join('');
}

// Renderiza o gráfico de linha simples (Chart.js) para receita dos últimos 6 meses
function renderizarGrafico(pedidos) {
  const ctx = document.getElementById('grafico-receita');
  if (!ctx) return;

  const meses = [];
  const valores = [];

  // Gera os últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    
    const mesTexto = d.toLocaleDateString('pt-BR', { month: 'short' });
    const mesNum = d.getMonth();
    const anoNum = d.getFullYear();

    // Filtra e soma a receita acumulada do mês respectivo
    const receitaMensal = pedidos
      .filter(p => {
        const dataPedido = new Date(p.created_at);
        return dataPedido.getMonth() === mesNum &&
               dataPedido.getFullYear() === anoNum &&
               p.status === 'aprovado';
      })
      .reduce((acc, p) => acc + Number(p.total || 0), 0);

    meses.push(mesTexto);
    valores.push(receitaMensal);
  }

  // Instancia o gráfico no Canvas
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: meses,
      datasets: [{
        data: valores,
        borderColor: '#C9A84C',
        backgroundColor: 'rgba(201, 168, 76, 0.04)',
        borderWidth: 1.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#C9A84C',
        pointBorderColor: '#FAF7F2',
        pointBorderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` Receita: R$ ${context.parsed.y.toFixed(2).replace('.', ',')}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#8B6F47',
            font: {
              size: 10,
              family: 'Montserrat'
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(196, 154, 108, 0.08)'
          },
          ticks: {
            color: '#8B6F47',
            font: {
              size: 10,
              family: 'Montserrat'
            },
            callback: function(val) {
              return 'R$ ' + val;
            }
          }
        }
      }
    }
  });
}

// Atualiza os badges contadores na sidebar para Pedidos e Inscrições pendentes
function atualizarBadgesSidebar(pedPendentes, insPendentes) {
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
}
