/* =============================================
   Sois Luz — admin-produtos.js
   Lógica de gerenciamento de produtos com tempo real.
   ============================================= */

// Cache de produtos local
window.produtosLocais = [];

// Inicia escutas e carrega dados
document.addEventListener('DOMContentLoaded', async () => {
  const perfil = await verificarSessao();
  if (!perfil) return;

  await carregarProdutos();
  inicializarRealtime();

  // Abre modal para novo produto
  document.getElementById('btn-novo-produto').addEventListener('click', () => {
    abrirModalForm();
  });

  // Fechar modal
  document.getElementById('btn-fechar-modal').addEventListener('click', fecharModal);
  document.getElementById('produto-modal').addEventListener('click', function (e) {
    if (e.target.id === 'produto-modal') fecharModal();
  });

  // Submissão do formulário de produto (Criação/Edição)
  document.getElementById('form-produto').addEventListener('submit', async function (e) {
    e.preventDefault();

    const id = document.getElementById('produto-id').value;
    const nome = document.getElementById('produto-nome').value.trim();
    const descricao = document.getElementById('produto-desc').value.trim();
    const preco = Number(document.getElementById('produto-preco').value);
    const badge = document.getElementById('produto-badge').value.trim();
    const imagem_url = document.getElementById('produto-imagem').value.trim();
    const ativo = document.getElementById('produto-ativo').checked;

    if (!nome || !descricao || isNaN(preco) || preco <= 0) {
      alert('Por favor, preencha todos os campos obrigatórios corretamente.');
      return;
    }

    const payload = {
      nome,
      descricao,
      preco,
      badge: badge || null,
      imagem_url: imagem_url || null,
      ativo
    };

    try {
      if (id) {
        // Edição
        const { error } = await db
          .from('produtos')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
      } else {
        // Criação
        const { error } = await db
          .from('produtos')
          .insert(payload);

        if (error) throw error;
      }

      fecharModal();
      await carregarProdutos();

    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      alert('Erro ao salvar produto. Tente novamente.');
    }
  });
});

// Busca produtos e calcula vendas com base em pedidos aprovados
async function carregarProdutos() {
  try {
    const [produtosRes, pedidosRes] = await Promise.all([
      db.from('produtos').select('*').order('created_at', { ascending: false }),
      db.from('pedidos').select('itens, total').eq('status', 'aprovado')
    ]);

    if (produtosRes.error) throw produtosRes.error;
    if (pedidosRes.error) throw pedidosRes.error;

    const produtos = produtosRes.data || [];
    const pedidosAprovados = pedidosRes.data || [];

    window.produtosLocais = produtos;

    // 1. Calcula quantidades vendidas de cada produto
    const contagemVendas = {};
    let totalUnidadesVendidas = 0;
    let faturamentoLoja = 0;

    pedidosAprovados.forEach(pedido => {
      faturamentoLoja += Number(pedido.total || 0);
      try {
        const itens = JSON.parse(pedido.itens || '[]');
        itens.forEach(item => {
          contagemVendas[item.id] = (contagemVendas[item.id] || 0) + Number(item.quantidade || 0);
          totalUnidadesVendidas += Number(item.quantidade || 0);
        });
      } catch (e) {
        console.error('Erro ao processar itens do pedido:', e);
      }
    });

    // 2. Preenche estatísticas nos cards do topo
    const totalAtivos = produtos.filter(p => p.ativo).length;

    const els = {
      ativos: document.getElementById('stat-ativos'),
      vendidos: document.getElementById('stat-vendidos'),
      receita: document.getElementById('stat-receita-produtos'),
      totalRegistros: document.getElementById('total-registros')
    };

    if (els.ativos) els.ativos.textContent = totalAtivos;
    if (els.vendidos) els.vendidos.textContent = totalUnidadesVendidas;
    if (els.receita) els.receita.textContent = `R$ ${faturamentoLoja.toFixed(2).replace('.', ',')}`;
    if (els.totalRegistros) els.totalRegistros.textContent = `${produtos.length} produtos registrados`;

    // 3. Renderiza a listagem de cards de produtos
    renderizarProdutos(produtos, contagemVendas);
    await recarregarBadgesSidebar();

  } catch (err) {
    console.error('Erro ao buscar produtos e pedidos:', err);
  }
}

// Renderiza a lista de produtos em cards
function renderizarProdutos(produtos, vendas) {
  const grid = document.getElementById('produtos-grid');
  if (!grid) return;

  if (!produtos.length) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-style: italic; padding: var(--space-8);">Nenhum produto cadastrado na loja no momento.</div>';
    return;
  }

  grid.innerHTML = produtos.map(p => {
    const unidadesVendidas = vendas[p.id] || 0;
    const badgeAtivoClass = p.ativo ? 'badge--confirmado' : 'badge--passado';
    const badgeAtivoTexto = p.ativo ? 'Disponível' : 'Inativo';

    // Badge promocional ou informativo do produto (ex: "Mais pedido")
    let badgeDestaqueHTML = '';
    if (p.badge) {
      badgeDestaqueHTML = `<span class="badge badge--admin" style="font-size: 8px; margin-left: var(--space-2); vertical-align: middle;">${p.badge}</span>`;
    }

    // Botão de toggle rápido de ativo
    const btnToggleTexto = p.ativo ? 'Desativar' : 'Ativar';
    const btnToggleClasse = p.ativo ? 'btn-cancelar' : 'btn-confirmar';

    return `
      <article class="admin-produto-card">
        <img class="admin-produto-card__img" src="${p.imagem_url || '../assets/produto-kit.jpg'}" alt="${p.nome}">
        <div class="admin-produto-card__body">
          <div class="admin-produto-card__header">
            <h3 class="admin-produto-card__nome">${p.nome} ${badgeDestaqueHTML}</h3>
            <span class="badge ${badgeAtivoClass}">${badgeAtivoTexto}</span>
          </div>

          <div class="admin-produto-card__stats">
            <div class="admin-produto-card__stat">
              <span class="admin-produto-card__stat-label">Preço</span>
              <span class="admin-produto-card__stat-valor">R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="admin-produto-card__stat">
              <span class="admin-produto-card__stat-label">Vendas</span>
              <span class="admin-produto-card__stat-valor">${unidadesVendidas} un.</span>
            </div>
          </div>

          <p style="font-family: var(--font-body); font-weight: 300; font-size: var(--fs-xs); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; color: var(--text-secondary); margin-top: var(--space-2);">
            ${p.descricao || 'Nenhuma descrição detalhada cadastrada.'}
          </p>

          <div class="admin-produto-card__footer">
            <div style="margin-left: auto; display: flex; gap: var(--space-2);">
              <button class="btn-secundario" onclick="abrirModalForm('${p.id}')">Editar</button>
              <button class="btn-secundario ${btnToggleClasse}" onclick="toggleAtivoProduto('${p.id}', ${!p.ativo})">${btnToggleTexto}</button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Abre modal de formulário em modo de Criação ou Edição
function abrirModalForm(id = null) {
  const form = document.getElementById('form-produto');
  if (!form) return;

  form.reset();

  const tituloEl = document.getElementById('modal-titulo');

  if (id) {
    // MODO EDIÇÃO
    const p = window.produtosLocais.find(item => item.id === id);
    if (!p) return;

    tituloEl.textContent = 'Editar Produto';
    document.getElementById('produto-id').value = p.id;
    document.getElementById('produto-nome').value = p.nome;
    document.getElementById('produto-desc').value = p.descricao || '';
    document.getElementById('produto-preco').value = p.preco || '';
    document.getElementById('produto-badge').value = p.badge || '';
    document.getElementById('produto-imagem').value = p.imagem_url || '';
    document.getElementById('produto-ativo').checked = p.ativo;

  } else {
    // MODO CRIAÇÃO
    tituloEl.textContent = 'Novo Produto';
    document.getElementById('produto-id').value = '';
    document.getElementById('produto-ativo').checked = true;
  }

  const modal = document.getElementById('produto-modal');
  modal.classList.add('is-open');
}

// Fecha o modal de formulário
function fecharModal() {
  document.getElementById('produto-modal').classList.remove('is-open');
}

// Liga/Desliga a flag ativo de um produto diretamente da listagem
async function toggleAtivoProduto(id, ativo) {
  try {
    const { error } = await db
      .from('produtos')
      .update({ ativo })
      .eq('id', id);

    if (error) throw error;

    await carregarProdutos();

  } catch (err) {
    console.error('Erro ao alternar status do produto:', err);
    alert('Erro ao alternar status do produto.');
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

// Inicializa a escuta de alterações Realtime para a tabela produtos
function inicializarRealtime() {
  db.channel('realtime-produtos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => {
      console.log('Atualização em tempo real (produtos)');
      carregarProdutos();
    })
    .subscribe();
}
