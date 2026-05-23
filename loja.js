/* =============================================
   Sois Luz — loja.js
   Single DOMContentLoaded. All functions above.
   GSAP + ScrollTrigger + Three.js + Supabase (db)
============================================= */

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.normalizeScroll(false);
ScrollTrigger.config({ ignoreMobileResize: true });

/* ---------- NAV STATE ---------- */
function initNavState() {
  var nav = document.getElementById('nav');
  if (!nav) return;
  var threshold = 24;

  function updateNavState() {
    nav.classList.toggle('nav--scrolled', window.scrollY > threshold);
  }

  updateNavState();
  window.addEventListener('scroll', updateNavState, { passive: true });
}

/* ---------- MOBILE MENU ---------- */
function initMobileMenu() {
  var btn = document.querySelector('.nav__hamburger');
  var overlay = document.getElementById('mobile-overlay');
  var links = document.querySelectorAll('.nav__mobile-menu a');
  var nav = document.getElementById('nav');
  if (!btn || !overlay) return;

  var isOpen = false;

  function openMenu() {
    isOpen = true;
    btn.classList.add('is-open');
    if (nav) nav.classList.add('nav--menu-open');
    overlay.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    gsap.to(links, {
      opacity: 1, y: 0, duration: 0.5,
      stagger: 0.07, ease: 'power3.out', delay: 0.2
    });
  }

  function closeMenu() {
    isOpen = false;
    btn.classList.remove('is-open');
    if (nav) nav.classList.remove('nav--menu-open');
    overlay.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    gsap.set(links, { opacity: 0, y: 20 });
  }

  btn.addEventListener('click', function () {
    isOpen ? closeMenu() : openMenu();
  });

  links.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });
}

/* ---------- GLOBAL PARTICLES ---------- */
function initGlobalParticles() {
  var canvas = document.getElementById('global-particles');
  if (!canvas) return;
  canvas.style.pointerEvents = 'none';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  var ctx = canvas.getContext('2d');
  var W = window.innerWidth;
  var H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;

  var QTD = Math.floor((W * H) / 18000);
  var particles = [];

  function createParticles() {
    particles = [];
    for (var i = 0; i < QTD; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.8 + 0.3,
        opacity: Math.random() * 0.5 + 0.1,
        speed: Math.random() * 0.25 + 0.05,
        drift: (Math.random() - 0.5) * 0.15,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulseOffset: Math.random() * Math.PI * 2,
        hasGlow: Math.random() > 0.7
      });
    }
  }

  var frame = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    frame++;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var pulse = Math.sin(frame * p.pulseSpeed + p.pulseOffset);
      var op = p.opacity + pulse * 0.15;
      if (p.hasGlow) {
        var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        grad.addColorStop(0, 'rgba(201, 168, 76, ' + (op * 0.6) + ')');
        grad.addColorStop(1, 'rgba(201, 168, 76, 0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(201, 168, 76, ' + op + ')';
      ctx.fill();
      p.y -= p.speed;
      p.x += p.drift;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
    }
    requestAnimationFrame(draw);
  }

  createParticles();
  draw();

  window.addEventListener('resize', function () {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    QTD = Math.floor((W * H) / 18000);
    createParticles();
  });
}

/* ---------- CUSTOM CURSOR ---------- */
function initCustomCursor() {
  var isTouch = window.matchMedia('(hover: none)').matches;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isTouch || reducedMotion) return;

  var dot = document.querySelector('.custom-cursor');
  var glow = document.querySelector('.custom-cursor-glow');
  if (!dot || !glow) return;

  document.body.classList.add('has-custom-cursor');

  var mouseX = 0, mouseY = 0;
  var dotX = 0, dotY = 0;
  var glowX = 0, glowY = 0;
  var visible = false;

  window.addEventListener('mousemove', function (e) {
    mouseX = e.clientX; mouseY = e.clientY;
    if (!visible) {
      visible = true;
      dot.style.opacity = '1'; glow.style.opacity = '1';
    }
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    visible = false;
    dot.style.opacity = '0'; glow.style.opacity = '0';
  });
  document.addEventListener('mouseenter', function () {
    visible = true;
    dot.style.opacity = '1'; glow.style.opacity = '1';
  });

  function updateCursor() {
    dotX += (mouseX - dotX) * 0.45;
    dotY += (mouseY - dotY) * 0.45;
    glowX += (mouseX - glowX) * 0.24;
    glowY += (mouseY - glowY) * 0.24;
    dot.style.left = dotX + 'px'; dot.style.top = dotY + 'px';
    glow.style.left = glowX + 'px'; glow.style.top = glowY + 'px';
    requestAnimationFrame(updateCursor);
  }
  updateCursor();

  var targets = 'a, button, input, textarea, select, [role="button"], .loja__card, .carrinho__item';
  document.addEventListener('mouseover', function (e) {
    if (e.target.closest(targets)) {
      dot.classList.add('is-hovering');
      glow.classList.add('is-hovering');
    }
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest(targets)) {
      dot.classList.remove('is-hovering');
      glow.classList.remove('is-hovering');
    }
  });
}

/* ---------- CARRINHO STATE ---------- */
var carrinho = {
  itens: [],

  adicionar: function (produto) {
    var existente = this.itens.find(function (i) { return i.id === produto.id; });
    if (existente) {
      existente.quantidade++;
    } else {
      this.itens.push({
        id: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        imagem_url: produto.imagem_url,
        quantidade: 1
      });
    }
    this.atualizar();
  },

  remover: function (id) {
    this.itens = this.itens.filter(function (i) { return i.id !== id; });
    this.atualizar();
  },

  alterarQtd: function (id, delta) {
    var item = this.itens.find(function (i) { return i.id === id; });
    if (!item) return;
    item.quantidade += delta;
    if (item.quantidade <= 0) {
      this.remover(id);
    } else {
      this.atualizar();
    }
  },

  get total() {
    return this.itens.reduce(function (acc, i) { return acc + i.preco * i.quantidade; }, 0);
  },

  get quantidade() {
    return this.itens.reduce(function (acc, i) { return acc + i.quantidade; }, 0);
  },

  atualizar: function () {
    renderizarCarrinho();
    atualizarBadge();
  }
};

/* ---------- THREE.JS — HERO LOJA ---------- */
function initLojaThree() {
  var canvas = document.getElementById('loja-three');
  if (!canvas) return;
  canvas.style.pointerEvents = 'none';

  var W = canvas.offsetWidth;
  var H = canvas.offsetHeight;

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas, alpha: true, antialias: true
  });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
  camera.position.z = 5;

  // Golden torus rings
  var aneis = [];
  var cores = [0xC9A84C, 0xE8C96A, 0xD4B896];

  cores.forEach(function (cor, i) {
    var geo = new THREE.TorusGeometry(1.5 + i * 0.6, 0.008, 16, 120);
    var mat = new THREE.MeshBasicMaterial({
      color: cor, transparent: true, opacity: 0.25 - i * 0.06
    });
    var anel = new THREE.Mesh(geo, mat);
    anel.rotation.x = Math.PI / 3 + i * 0.3;
    anel.rotation.y = i * 0.5;
    scene.add(anel);
    aneis.push(anel);
  });

  // Background particles
  var count = 120;
  var geo   = new THREE.BufferGeometry();
  var pos   = new Float32Array(count * 3);
  for (var i = 0; i < count; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 10;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var mat2 = new THREE.PointsMaterial({
    color: 0xC9A84C, size: 0.05, transparent: true, opacity: 0.5
  });
  scene.add(new THREE.Points(geo, mat2));

  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden) return;
    aneis.forEach(function (anel, idx) {
      anel.rotation.z += 0.002 * (idx % 2 === 0 ? 1 : -1);
      anel.rotation.y += 0.001;
    });
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', function () {
    var W2 = canvas.offsetWidth;
    var H2 = canvas.offsetHeight;
    camera.aspect = W2 / H2;
    camera.updateProjectionMatrix();
    renderer.setSize(W2, H2);
  });
}

/* ---------- HERO GSAP ---------- */
function initLojaHero() {
  gsap.to('.loja-hero__content', {
    opacity: 1, y: 0, duration: 1.2,
    ease: 'power3.out', delay: 0.3
  });
}

/* ---------- CARREGAR PRODUTOS ---------- */
async function carregarProdutos() {
  var grid    = document.getElementById('loja-grid');
  var loading = document.getElementById('loja-loading');

  try {
    var result = await db
      .from('produtos')
      .select('*')
      .eq('ativo', true);

    var data = result.data;
    var error = result.error;

    if (error) throw error;

    if (loading) loading.classList.add('hidden');

    if (!data || !data.length) {
      grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);font-family:var(--font-body);font-size:var(--fs-sm);">Nenhum produto disponivel no momento.</p>';
      return;
    }

    grid.innerHTML = data.map(function (p, i) {
      var badgeHTML = '';
      if (p.badge) {
        var badgeClass = i === 0 ? 'loja__badge--destaque' : 'loja__badge--normal';
        badgeHTML = '<span class="loja__badge ' + badgeClass + '">' + p.badge + '</span>';
      }

      return '<article class="loja__card" data-id="' + p.id + '">' +
        '<div class="loja__card-glow"></div>' +
        '<div class="loja__imagem-wrap">' +
          '<img class="loja__imagem" src="' + (p.imagem_url || 'assets/produto-kit.jpg') + '" alt="' + p.nome + '" loading="lazy">' +
          '<div class="loja__imagem-overlay"></div>' +
          badgeHTML +
        '</div>' +
        '<div class="loja__corpo">' +
          '<span class="loja__numero">0' + (i + 1) + '</span>' +
          '<h3 class="loja__nome">' + p.nome + '</h3>' +
          '<p class="loja__desc">' + (p.descricao || '') + '</p>' +
          '<div class="loja__rodape">' +
            '<span class="loja__preco">R$ ' + Number(p.preco).toFixed(2).replace('.', ',') + '</span>' +
            '<button class="loja__btn-carrinho" data-produto=\'' + JSON.stringify(p).replace(/'/g, '&#39;') + '\'>' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                '<path d="M12 5v14M5 12h14"/>' +
              '</svg>' +
              'Adicionar' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    // Bind add-to-cart buttons
    grid.querySelectorAll('.loja__btn-carrinho').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var produto = JSON.parse(this.getAttribute('data-produto'));
        adicionarAoCarrinho(produto, this);
      });
    });

    // GSAP ScrollTrigger
    gsap.to('.loja__card', {
      opacity: 1, y: 0, duration: 1, stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.loja__grid', start: 'top 80%' }
    });

    ScrollTrigger.refresh();

    // Tilt 3D — desktop only
    var isTouchDevice = window.matchMedia('(hover: none)').matches;
    if (!isTouchDevice) {
      document.querySelectorAll('.loja__card').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
          var rect = card.getBoundingClientRect();
          var dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
          var dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
          gsap.to(card, {
            rotateY: dx * 6, rotateX: -dy * 6,
            duration: 0.4, ease: 'power2.out',
            transformPerspective: 800
          });
        });
        card.addEventListener('mouseleave', function () {
          gsap.to(card, {
            rotateY: 0, rotateX: 0,
            duration: 0.6, ease: 'elastic.out(1, 0.5)'
          });
        });
      });
    }

  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
    if (loading) {
      loading.innerHTML = '<p>Erro ao carregar produtos. Tente novamente.</p>';
    }
  }
}

/* ---------- ADICIONAR AO CARRINHO ---------- */
function adicionarAoCarrinho(produto, btn) {
  carrinho.adicionar(produto);

  // Visual feedback
  btn.classList.add('adicionado');
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<path d="M20 6L9 17l-5-5"/>' +
    '</svg>' +
    'Adicionado!';

  setTimeout(function () {
    btn.classList.remove('adicionado');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<path d="M12 5v14M5 12h14"/>' +
      '</svg>' +
      'Adicionar';
  }, 1800);

  // Badge bounce
  gsap.from('#carrinho-count', {
    scale: 1.4, duration: 0.3, ease: 'elastic.out(1, 0.5)'
  });
}

/* ---------- BADGE ---------- */
function atualizarBadge() {
  var badge = document.getElementById('carrinho-count');
  var qtd   = carrinho.quantidade;
  badge.textContent = qtd;
  if (qtd > 0) {
    badge.classList.add('visivel');
  } else {
    badge.classList.remove('visivel');
  }
}

/* ---------- RENDERIZAR CARRINHO ---------- */
function renderizarCarrinho() {
  var container = document.getElementById('carrinho-itens');
  var vazio     = document.getElementById('carrinho-vazio');
  var rodape    = document.getElementById('carrinho-rodape');
  var totalEl   = document.getElementById('carrinho-total');

  if (!carrinho.itens.length) {
    container.innerHTML = '';
    vazio.classList.remove('hidden');
    rodape.style.display = 'none';
    return;
  }

  vazio.classList.add('hidden');
  rodape.style.display = 'flex';

  container.innerHTML = carrinho.itens.map(function (item) {
    return '<div class="carrinho__item" data-id="' + item.id + '">' +
      '<img class="item__thumb" src="' + (item.imagem_url || 'assets/produto-kit.jpg') + '" alt="' + item.nome + '">' +
      '<div class="item__info">' +
        '<span class="item__nome">' + item.nome + '</span>' +
        '<span class="item__preco">R$ ' + Number(item.preco).toFixed(2).replace('.', ',') + ' cada</span>' +
        '<div class="item__qtd">' +
          '<button class="item__qtd-btn" data-id="' + item.id + '" data-delta="-1">' + String.fromCharCode(8722) + '</button>' +
          '<span class="item__qtd-num">' + item.quantidade + '</span>' +
          '<button class="item__qtd-btn" data-id="' + item.id + '" data-delta="1">+</button>' +
        '</div>' +
      '</div>' +
      '<button class="item__remover" data-id="' + item.id + '">' + String.fromCharCode(10005) + '</button>' +
    '</div>';
  }).join('');

  // Bind qty buttons
  container.querySelectorAll('.item__qtd-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      carrinho.alterarQtd(this.getAttribute('data-id'), parseInt(this.getAttribute('data-delta')));
    });
  });

  // Bind remove buttons
  container.querySelectorAll('.item__remover').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var itemEl = this.closest('.carrinho__item');
      gsap.to(itemEl, {
        opacity: 0, height: 0, paddingBottom: 0, marginBottom: 0,
        duration: 0.3, ease: 'power2.in',
        onComplete: function () {
          carrinho.remover(btn.getAttribute('data-id'));
        }
      });
    });
  });

  totalEl.textContent = 'R$ ' + Number(carrinho.total).toFixed(2).replace('.', ',');
}

/* ---------- ABRIR / FECHAR DRAWER ---------- */
function abrirCarrinho() {
  document.getElementById('carrinho-drawer').classList.add('is-open');
  document.getElementById('carrinho-overlay').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function fecharCarrinho() {
  document.getElementById('carrinho-drawer').classList.remove('is-open');
  document.getElementById('carrinho-overlay').classList.remove('is-open');
  document.body.style.overflow = '';
}

/* ---------- MODAL CHECKOUT ---------- */
function abrirCheckout() {
  if (!carrinho.itens.length) return;
  fecharCarrinho();

  var resumo  = document.getElementById('checkout-resumo');
  var totalEl = document.getElementById('checkout-total-valor');

  resumo.innerHTML = carrinho.itens.map(function (item) {
    return '<div class="resumo__item">' +
      '<span>' + item.nome + ' x ' + item.quantidade + '</span>' +
      '<span>R$ ' + (item.preco * item.quantidade).toFixed(2).replace('.', ',') + '</span>' +
    '</div>';
  }).join('');

  totalEl.textContent = 'R$ ' + carrinho.total.toFixed(2).replace('.', ',');

  // Reset form state
  document.getElementById('form-checkout').classList.remove('hidden');
  document.getElementById('form-checkout').reset();
  document.getElementById('checkout-sucesso').classList.add('hidden');
  document.getElementById('checkout-erro').classList.add('hidden');

  var overlay = document.getElementById('modal-checkout');
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  gsap.fromTo('.checkout__card',
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
  );
}

function fecharCheckout() {
  var overlay = document.getElementById('modal-checkout');
  gsap.to('.checkout__card', {
    opacity: 0, y: 20, duration: 0.3, ease: 'power3.in',
    onComplete: function () {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });
}

/* ---------- ENVIAR PEDIDO ---------- */
function initFormCheckout() {
  var form = document.getElementById('form-checkout');
  if (!form) return;

  const cepEl = document.getElementById('checkout-cep');
  if (cepEl) {
    // Busca automática de CEP
    cepEl.addEventListener('blur', async function() {
      const cep = this.value.replace(/\D/g, '');
      if (cep.length !== 8) return;

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          document.getElementById('checkout-rua').value = data.logradouro || '';
          document.getElementById('checkout-cidade').value = data.localidade || '';
          document.getElementById('checkout-estado').value = data.uf || '';
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      }
    });

    // Máscara do CEP
    cepEl.addEventListener('input', function() {
      let v = this.value.replace(/\D/g, '');
      if (v.length > 5) v = v.slice(0,5) + '-' + v.slice(5,8);
      this.value = v;
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnTexto   = document.querySelector('#btn-pagar .btn__texto');
    const btnLoading = document.querySelector('#btn-pagar .btn__loading');

    btnTexto.classList.add('hidden');
    btnLoading.classList.remove('hidden');

    const nome        = document.getElementById('checkout-nome').value.trim();
    const email       = document.getElementById('checkout-email').value.trim();
    const telefone    = document.getElementById('checkout-tel').value.trim();
    const cep         = document.getElementById('checkout-cep').value.trim();
    const rua         = document.getElementById('checkout-rua').value.trim();
    const numero      = document.getElementById('checkout-numero').value.trim();
    const complemento = document.getElementById('checkout-complemento').value.trim();
    const cidade      = document.getElementById('checkout-cidade').value.trim();
    const estado      = document.getElementById('checkout-estado').value.trim();

    // Validação básica
    if (!nome || !email || !telefone || !cep || !rua || !numero || !cidade || !estado) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      btnTexto.classList.remove('hidden');
      btnLoading.classList.add('hidden');
      return;
    }

    if (!carrinho.itens.length) {
      alert('Seu carrinho está vazio.');
      btnTexto.classList.remove('hidden');
      btnLoading.classList.add('hidden');
      return;
    }

    try {
      await finalizarCompra(nome, email, telefone);
      // Se chegar aqui sem erro o redirecionamento
      // já aconteceu dentro de finalizarCompra
    } catch (err) {
      console.error('Erro no checkout:', err);
      alert('Erro ao processar pagamento. Tente novamente.');
      btnTexto.classList.remove('hidden');
      btnLoading.classList.add('hidden');
    }
  });
}


/* ---------- SECTION HEADER GSAP ---------- */
function initLojaHeaders() {
  gsap.utils.toArray('.section__header').forEach(function (header) {
    gsap.to(header, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: header, start: 'top 80%' }
    });
  });
}

/* ---------- FOOTER GSAP ---------- */
function initFooter() {
  gsap.from('#footer', {
    opacity: 0, y: 20, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '#footer', start: 'top 90%' }
  });
}

/* ---------- FINALIZAR COMPRA (MERCADO PAGO VIA SUPABASE EDGE FUNCTION) ---------- */
async function finalizarCompra(nome, email, telefone) {
  const cep          = document.getElementById('checkout-cep').value.trim();
  const rua          = document.getElementById('checkout-rua').value.trim();
  const numero       = document.getElementById('checkout-numero').value.trim();
  const complemento  = document.getElementById('checkout-complemento').value.trim();
  const cidade       = document.getElementById('checkout-cidade').value.trim();
  const estado       = document.getElementById('checkout-estado').value.trim();

  const endereco = `${rua}, ${numero}${complemento ? ', ' + complemento : ''} — ${cidade}/${estado} — CEP ${cep}`;
  
  const pedidoRef = crypto.randomUUID();

  // 1. Salva o pedido no Supabase
  const { error: erroPedido } = await db
    .from('pedidos')
    .insert({
      id:       pedidoRef,
      nome,
      email,
      telefone,
      endereco,
      itens:  JSON.stringify(carrinho.itens),
      total:  carrinho.total,
      status: 'pendente'
    });

  if (erroPedido) {
    throw new Error('Erro ao salvar pedido: ' + erroPedido.message);
  }

  // 2. Chama a Edge Function do Supabase
  const funcUrl = `${window.SUPABASE_URL}/functions/v1/criar-preferencia`;

  const response = await fetch(funcUrl, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      itens:     carrinho.itens,
      nome,
      email,
      telefone,
      pedido_id: pedidoRef
    })
  });

  const resultado = await response.json();

  if (!resultado.sucesso) {
    throw new Error(resultado.mensagem || 'Erro no pagamento');
  }

  // 3. Atualiza o pedido com o ID da preferência
  await db
    .from('pedidos')
    .update({ mp_preference: resultado.preferencia_id })
    .eq('id', pedidoRef);

  // 4. Redireciona para o Mercado Pago
  window.location.href = resultado.checkout_url;
}

/* =============================================
   SINGLE DOMContentLoaded
============================================= */
document.addEventListener('DOMContentLoaded', function () {
  initGlobalParticles();
  initCustomCursor();
  initNavState();
  initMobileMenu();
  initLojaThree();
  initLojaHero();
  initLojaHeaders();
  initFooter();
  carregarProdutos();
  initFormCheckout();

  // Carrinho drawer
  document.getElementById('btn-carrinho-nav')
    .addEventListener('click', abrirCarrinho);
  document.getElementById('btn-fechar-carrinho')
    .addEventListener('click', fecharCarrinho);
  document.getElementById('carrinho-overlay')
    .addEventListener('click', fecharCarrinho);
  document.getElementById('btn-checkout')
    .addEventListener('click', abrirCheckout);

  // Checkout modal
  document.getElementById('checkout-fechar')
    .addEventListener('click', fecharCheckout);
  document.getElementById('modal-checkout')
    .addEventListener('click', function (e) {
      if (e.target.id === 'modal-checkout') fecharCheckout();
    });

  // Initial cart render
  renderizarCarrinho();
  atualizarBadge();
});
