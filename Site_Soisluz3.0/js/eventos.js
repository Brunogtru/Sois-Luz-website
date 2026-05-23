/* =============================================
   Sois Luz — eventos.js
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

  var targets = 'a, button, input, textarea, select, [role="button"], .proximo__card, .passado__card';
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

/* ---------- THREE.JS — HERO PARTICLES ---------- */
function initEventosThree() {
  var canvas = document.getElementById('eventos-three');
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

  var count    = 180;
  var geometry = new THREE.BufferGeometry();
  var positions = new Float32Array(count * 3);
  var sizes     = new Float32Array(count);

  for (var i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    sizes[i] = Math.random() * 3 + 1;
  }

  geometry.setAttribute('position',
    new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size',
    new THREE.BufferAttribute(sizes, 1));

  var material = new THREE.PointsMaterial({
    color:       0xC9A84C,
    size:        0.06,
    transparent: true,
    opacity:     0.6,
    sizeAttenuation: true
  });

  var particles = new THREE.Points(geometry, material);
  scene.add(particles);

  var frameCount = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden) return;
    frameCount += 0.003;
    particles.rotation.y = frameCount * 0.08;
    particles.rotation.x = Math.sin(frameCount * 0.3) * 0.05;
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
function initEventosHero() {
  gsap.to('.eventos-hero__content', {
    opacity: 1, y: 0, duration: 1.2,
    ease: 'power3.out', delay: 0.3
  });
}

/* ---------- FORMAT DATE ---------- */
function formatarData(dataStr) {
  if (!dataStr) return '';
  var data = new Date(dataStr + 'T00:00:00');
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

/* ---------- CARREGAR PROXIMOS EVENTOS ---------- */
async function carregarProximosEventos() {
  var grid    = document.getElementById('proximos-grid');
  var loading = document.getElementById('eventos-loading');
  var vazio   = document.getElementById('proximos-vazio');

  try {
    var result = await db
      .from('eventos')
      .select('*')
      .eq('status', 'proximo')
      .order('data_evento', { ascending: true });

    var data = result.data;
    var error = result.error;

    if (error) throw error;

    if (loading) loading.classList.add('hidden');

    if (!data || !data.length) {
      if (vazio) vazio.classList.remove('hidden');
      return;
    }

    grid.innerHTML = data.map(function (e) {
      var badgeClass = e.gratuito ? 'proximo__badge--gratuito' : 'proximo__badge--pago';
      var badgeText  = e.gratuito ? 'Gratuito' : 'Evento pago';
      var precoHTML  = e.gratuito
        ? '<span class="proximo__preco--gratuito">&#10022; Entrada gratuita</span>'
        : '<span class="proximo__preco">R$ ' + Number(e.preco).toFixed(2).replace('.', ',') + '</span>';

      var vagasHTML = '';
      if (e.vagas) {
        vagasHTML = '<div class="proximo__info">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
          '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>' +
          '<circle cx="9" cy="7" r="4"/>' +
          '<path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>' +
          '</svg>' +
          '<span>' + e.vagas + ' vagas disponiveis</span>' +
          '</div>';
      }

      var descHTML = '';
      if (e.descricao) {
        descHTML = '<p class="proximo__desc">' + e.descricao + '</p>';
      }

      return '<article class="proximo__card" data-id="' + e.id + '">' +
        '<div class="proximo__imagem-wrap">' +
          '<img class="proximo__imagem" src="' + (e.imagem_url || 'assets/evento-capa.jpg') + '" alt="' + e.nome + '" loading="lazy">' +
          '<span class="proximo__badge ' + badgeClass + '">' + badgeText + '</span>' +
        '</div>' +
        '<div class="proximo__corpo">' +
          '<div>' +
            '<span class="proximo__tag">Encontro a Mesa</span>' +
            '<h3 class="proximo__nome">' + e.nome + '</h3>' +
          '</div>' +
          '<div class="proximo__infos">' +
            '<div class="proximo__info">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
              '<rect x="3" y="4" width="18" height="18" rx="2"/>' +
              '<path d="M16 2v4M8 2v4M3 10h18"/>' +
              '</svg>' +
              '<span>' + formatarData(e.data_evento) + (e.horario ? ' — ' + e.horario : '') + '</span>' +
            '</div>' +
            '<div class="proximo__info">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
              '<path d="M12 21s-8-7.5-8-12a8 8 0 1116 0c0 4.5-8 12-8 12z"/>' +
              '<circle cx="12" cy="9" r="2.5"/>' +
              '</svg>' +
              '<span>' + (e.local || 'Suzano, SP') + '</span>' +
            '</div>' +
            vagasHTML +
          '</div>' +
          descHTML +
          '<div class="proximo__rodape">' +
            precoHTML +
            '<button class="proximo__btn" data-evento=\'' + JSON.stringify(e).replace(/'/g, '&#39;') + '\'>Quero participar</button>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    // Bind botoes
    grid.querySelectorAll('.proximo__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var evento = JSON.parse(this.getAttribute('data-evento'));
        abrirModal(evento);
      });
    });

    // GSAP ScrollTrigger
    gsap.to('.proximo__card', {
      opacity: 1, y: 0, duration: 0.9, stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.proximos__grid', start: 'top 80%' }
    });

    ScrollTrigger.refresh();
  } catch (err) {
    console.error('Erro ao carregar proximos eventos:', err);
    if (loading) {
      loading.innerHTML = '<p>Erro ao carregar eventos. Tente novamente.</p>';
    }
  }
}

/* ---------- CARREGAR EVENTOS PASSADOS ---------- */
async function carregarEventosPassados() {
  var grid    = document.getElementById('passados-grid');
  var divisor = document.getElementById('eventos-divisor');
  var section = document.getElementById('eventos-passados');

  try {
    var result = await db
      .from('eventos')
      .select('*')
      .eq('status', 'passado')
      .order('data_evento', { ascending: false });

    var data = result.data;
    var error = result.error;

    if (error) throw error;

    if (!data || !data.length) {
      if (section) section.style.display = 'none';
      if (divisor) divisor.style.display = 'none';
      return;
    }

    grid.innerHTML = data.map(function (e) {
      return '<article class="passado__card">' +
        '<img class="passado__imagem" src="' + (e.imagem_url || 'assets/evento-capa.jpg') + '" alt="' + e.nome + '" loading="lazy">' +
        '<div class="passado__overlay">' +
          '<h3 class="passado__nome">' + e.nome + '</h3>' +
          '<span class="passado__data">' + formatarData(e.data_evento) + '</span>' +
        '</div>' +
      '</article>';
    }).join('');

    gsap.to('.passado__card', {
      opacity: 1, y: 0, duration: 0.7, stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.passados__grid', start: 'top 80%' }
    });

    ScrollTrigger.refresh();
  } catch (err) {
    console.error('Erro ao carregar eventos passados:', err);
  }
}

/* ---------- MODAL DE INSCRICAO ---------- */
function abrirModal(evento) {
  var overlay = document.getElementById('modal-inscricao');

  document.getElementById('modal-evento-id').value = evento.id;
  document.getElementById('modal-evento-nome').textContent = evento.nome;
  document.getElementById('modal-data').textContent =
    formatarData(evento.data_evento) + (evento.horario ? ' — ' + evento.horario : '');
  document.getElementById('modal-local').textContent = evento.local || 'Suzano, SP';
  document.getElementById('modal-preco').textContent =
    evento.gratuito ? 'Gratuito' : 'R$ ' + Number(evento.preco).toFixed(2).replace('.', ',');
  document.getElementById('modal-obs-preco').textContent =
    evento.gratuito
      ? 'Este evento e gratuito. Sua vaga sera confirmada por WhatsApp.'
      : 'O pagamento sera combinado por WhatsApp apos a inscricao.';

  // Reset form state
  document.getElementById('form-inscricao').classList.remove('hidden');
  document.getElementById('form-inscricao').reset();
  document.getElementById('modal-sucesso').classList.add('hidden');
  document.getElementById('form-erro').classList.add('hidden');

  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  gsap.to('.modal__card', {
    opacity: 1, y: 0, duration: 0.5, ease: 'power3.out'
  });
}

function fecharModal() {
  var overlay = document.getElementById('modal-inscricao');

  gsap.to('.modal__card', {
    opacity: 0, y: 20, duration: 0.3, ease: 'power3.in',
    onComplete: function () {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      // Reset modal card position for next open
      gsap.set('.modal__card', { opacity: 0, y: 20 });
    }
  });
}

/* ---------- ENVIAR INSCRICAO ---------- */
function initFormInscricao() {
  var form = document.getElementById('form-inscricao');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    var btnTexto   = document.querySelector('.btn__texto');
    var btnLoading = document.querySelector('.btn__loading');
    var formErro   = document.getElementById('form-erro');

    btnTexto.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    formErro.classList.add('hidden');

    var payload = {
      evento_id: document.getElementById('modal-evento-id').value,
      nome:      document.getElementById('input-nome').value,
      email:     document.getElementById('input-email').value,
      telefone:  document.getElementById('input-tel').value
    };

    try {
      var result = await db
        .from('inscricoes')
        .insert(payload);

      var error = result.error;

      if (error) {
        formErro.textContent = error.message || 'Erro ao realizar inscricao.';
        formErro.classList.remove('hidden');
      } else {
        form.classList.add('hidden');
        var sucesso = document.getElementById('modal-sucesso');
        sucesso.classList.remove('hidden');

        // Animate success icon
        gsap.from('.sucesso__icone', {
          scale: 0, rotation: 180, duration: 0.6,
          ease: 'elastic.out(1, 0.5)'
        });
      }

    } catch (err) {
      formErro.textContent = 'Erro de conexao. Tente novamente.';
      formErro.classList.remove('hidden');
    } finally {
      btnTexto.classList.remove('hidden');
      btnLoading.classList.add('hidden');
    }
  });
}

/* ---------- SECTION HEADERS GSAP ---------- */
function initSectionHeaders() {
  gsap.utils.toArray('.section__header').forEach(function (header) {
    gsap.to(header, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: header, start: 'top 80%' }
    });
  });
}

/* ---------- DIVISOR GSAP ---------- */
function initDivisor() {
  var divisor = document.querySelector('.eventos__divisor');
  if (!divisor) return;

  gsap.from('.divisor__linha', {
    scaleX: 0, duration: 1.2, stagger: 0.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.eventos__divisor', start: 'top 85%' }
  });

  gsap.from(['.divisor__icone', '.divisor__texto'], {
    opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power2.out',
    scrollTrigger: { trigger: '.eventos__divisor', start: 'top 85%' }
  });
}

/* ---------- FOOTER GSAP ---------- */
function initFooter() {
  gsap.from('#footer', {
    opacity: 0, y: 20, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '#footer', start: 'top 90%' }
  });
}

/* =============================================
   SINGLE DOMContentLoaded
============================================= */
document.addEventListener('DOMContentLoaded', function () {
  initGlobalParticles();
  initCustomCursor();
  initNavState();
  initMobileMenu();
  initEventosThree();
  initEventosHero();
  initSectionHeaders();
  initDivisor();
  initFormInscricao();
  initFooter();

  // Carregar dados do Supabase
  carregarProximosEventos();
  carregarEventosPassados();

  // Fechar modal
  document.getElementById('modal-fechar')
    .addEventListener('click', fecharModal);
  document.getElementById('modal-inscricao')
    .addEventListener('click', function (e) {
      if (e.target.id === 'modal-inscricao') fecharModal();
    });
});
