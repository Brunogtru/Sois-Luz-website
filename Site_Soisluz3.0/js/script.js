/* =============================================
   Sois Luz — script.js
   Single DOMContentLoaded. All functions above.
   GSAP + ScrollTrigger required.

   BUGS CORRIGIDOS:
   - Removidos canvas individuais (#evento-particles, #produtos-particles)
     em favor de um unico #global-particles global
   - Substituido nav hamburger antigo (2 linhas, is-active)
     por novo hamburger de 3 linhas (is-open) + overlay escuro
   - Removido initClickParticles (canvas click-particles nao existe mais)
   - Adicionado initGlobalParticles, initCustomCursor, initMobileMenu
============================================= */

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.normalizeScroll(false);
ScrollTrigger.config({ ignoreMobileResize: true });

/* ---------- NAV STATE ---------- */
function initNavState() {
  var nav = document.getElementById('nav');
  if (!nav) return;
  var threshold = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-scroll-threshold'));

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
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.07,
      ease: 'power3.out',
      delay: 0.2
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

/* ---------- HERO ---------- */
function initHero() {
  document.querySelectorAll('.hero__title-word').forEach(function (word) {
    var text = word.textContent;
    word.innerHTML = text.split('').map(function (char) {
      return '<span class="hero__title-char">' + char + '</span>';
    }).join('');
  });

  var tl = gsap.timeline({ delay: 0.3 });

  tl.to('.hero__content', { opacity: 1, duration: 0.01 })
    .to('.hero__eyebrow', {
      opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
    })
    .to('.hero__title-char', {
      opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out'
    }, '-=0.4')
    .to('.hero__verse', {
      opacity: 1, y: 0, duration: 0.6, ease: 'power3.out'
    }, '-=0.2')
    .to('.hero__cta', {
      opacity: 1, y: 0, duration: 0.6, ease: 'power3.out'
    }, '-=0.3')
    .to('.hero__scroll-hint', {
      opacity: 1, duration: 1, ease: 'power2.out'
    }, '+=0.5');
}

function initHeroParallax() {
  gsap.to('.hero__bg img', {
    yPercent: 15,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });
}

/* ---------- MANIFESTO ---------- */
function initManifesto() {
  gsap.to('.manifesto__line', {
    opacity: 1,
    duration: 1,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '#manifesto',
      start: 'top 80%'
    }
  });

  gsap.to('.manifesto__block', {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.3,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.manifesto__blocks',
      start: 'top 75%'
    }
  });

  gsap.to('.manifesto__signature', {
    opacity: 1,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.manifesto__signature',
      start: 'top 90%'
    }
  });
}

/* ---------- EVENTO ---------- */
function initEvento() {
  gsap.to('.evento__header', {
    opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '#proximo-evento', start: 'top 75%' }
  });

  gsap.to('.evento__countdown', {
    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '.evento__countdown', start: 'top 80%' }
  });

  gsap.to('.evento__card', {
    opacity: 1, y: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.evento__card', start: 'top 80%' }
  });

  gsap.to(['.evento__inspiracao', '.evento__btn'], {
    opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.evento__inspiracao', start: 'top 85%' }
  });
}

/* ---------- COUNTDOWN ---------- */
function iniciarCountdown(dataEvento) {
  if (!dataEvento) return;

  function atualizar() {
    var agora = new Date();
    var diff = dataEvento - agora;

    if (diff <= 0) {
      var el = document.querySelector('.evento__countdown');
      if (el) el.innerHTML = '<p class="countdown__encerrado">O encontro chegou &#10022;</p>';
      return;
    }

    var dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    var horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
    var minutos = Math.floor((diff / (1000 * 60)) % 60);
    var segundos = Math.floor((diff / 1000) % 60);

    var elD = document.getElementById('cd-dias');
    var elH = document.getElementById('cd-horas');
    var elM = document.getElementById('cd-minutos');
    var elS = document.getElementById('cd-segundos');

    if (elD) elD.textContent = String(dias).padStart(2, '0');
    if (elH) elH.textContent = String(horas).padStart(2, '0');
    if (elM) elM.textContent = String(minutos).padStart(2, '0');
    if (elS) elS.textContent = String(segundos).padStart(2, '0');
  }

  atualizar();
  setInterval(atualizar, 1000);
}

/* ---------- SUPABASE: CARREGAR PRÓXIMO EVENTO ---------- */
async function carregarProximoEvento() {
  try {
    const { data, error } = await db
      .from('eventos')
      .select('*')
      .eq('status', 'proximo')
      .order('data_evento', { ascending: true })
      .limit(1)
      .single()

    if (error || !data) {
      // Esconde a seção inteira se não há evento
      const secao = document.getElementById('proximo-evento')
      if (secao) secao.style.display = 'none'
      return
    }

    // Formata data em português
    const dataFormatada = new Date(data.data_evento + 'T00:00:00')
      .toLocaleDateString('pt-BR', {
        day:   '2-digit',
        month: 'long',
        year:  'numeric'
      })

    // Preenche os dados no HTML
    const els = {
      nome:     document.getElementById('evento-nome'),
      data:     document.getElementById('evento-data'),
      horario:  document.getElementById('evento-horario'),
      local:    document.getElementById('evento-local'),
      desc:     document.getElementById('evento-desc'),
      preco:    document.getElementById('evento-preco'),
      imagem:   document.getElementById('evento-imagem'),
      badge:    document.getElementById('evento-badge')
    }

    if (els.nome)    els.nome.textContent    = data.nome
    if (els.data)    els.data.textContent    = dataFormatada
    if (els.horario) els.horario.textContent = data.horario
    if (els.local)   els.local.textContent   = data.local
    if (els.desc)    els.desc.textContent    = data.descricao || ''

    if (els.preco) {
      els.preco.textContent = data.gratuito
        ? '✦ Entrada gratuita'
        : `R$ ${Number(data.preco).toFixed(2).replace('.', ',')}`
    }

    if (els.badge) {
      els.badge.textContent = data.gratuito ? 'Gratuito' : 'Evento pago'
      els.badge.className   = data.gratuito
        ? 'proximo__badge proximo__badge--gratuito'
        : 'proximo__badge proximo__badge--pago'
    }

    if (els.imagem && data.imagem_url) {
      els.imagem.src = data.imagem_url
      els.imagem.alt = data.nome
    }

    // Atualiza o countdown com a data real do evento
    const dataEvento = new Date(
      data.data_evento + 'T' + (data.horario?.slice(0,5) || '09:00') + ':00'
    )
    iniciarCountdown(dataEvento)

  } catch (err) {
    console.error('Erro ao carregar próximo evento:', err)
  }
}

/* ---------- PRODUTOS ---------- */
function initProdutos() {
  gsap.to('.produtos__header', {
    opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '#produtos', start: 'top 75%' }
  });

  gsap.to('.produto__card', {
    opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.produtos__grid', start: 'top 80%' }
  });

  /* Tilt 3D — disabled on touch */
  var isTouchDevice = window.matchMedia('(hover: none)').matches;

  if (!isTouchDevice) {
    document.querySelectorAll('.produto__card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) / (rect.width / 2);
        var dy = (e.clientY - cy) / (rect.height / 2);
        gsap.to(card, {
          rotateY: dx * 6, rotateX: -dy * 6,
          duration: 0.4, ease: 'power2.out', transformPerspective: 800
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

  gsap.to('.produtos__btn', {
    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '.produtos__btn', start: 'top 90%' }
  });
}

/* ---------- SOBRE ---------- */
function initSobre() {
  gsap.to('.sobre__imagem-col', {
    opacity: 1, x: 0, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: '#sobre', start: 'top 70%' }
  });

  gsap.to('.sobre__texto-col', {
    opacity: 1, x: 0, duration: 1.1, delay: 0.2, ease: 'power3.out',
    scrollTrigger: { trigger: '#sobre', start: 'top 70%' }
  });

  gsap.from('.sobre__linha-dourada', {
    scaleX: 0, transformOrigin: 'left', duration: 0.8, delay: 0.6, ease: 'power3.out',
    scrollTrigger: { trigger: '#sobre', start: 'top 70%' }
  });
}

/* ---------- FOOTER ---------- */
function initFooter() {
  gsap.from('#footer', {
    opacity: 0, y: 20, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '#footer', start: 'top 90%' }
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
        x: Math.random() * W,
        y: Math.random() * H,
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

      if (p.y < -10) {
        p.y = H + 10;
        p.x = Math.random() * W;
      }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
    }

    requestAnimationFrame(draw);
  }

  createParticles();
  draw();

  window.addEventListener('resize', function () {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
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
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!visible) {
      visible = true;
      dot.style.opacity = '1';
      glow.style.opacity = '1';
    }
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    visible = false;
    dot.style.opacity = '0';
    glow.style.opacity = '0';
  });

  document.addEventListener('mouseenter', function () {
    visible = true;
    dot.style.opacity = '1';
    glow.style.opacity = '1';
  });

  function updateCursor() {
    dotX += (mouseX - dotX) * 0.45;
    dotY += (mouseY - dotY) * 0.45;
    glowX += (mouseX - glowX) * 0.24;
    glowY += (mouseY - glowY) * 0.24;

    dot.style.left = dotX + 'px';
    dot.style.top = dotY + 'px';
    glow.style.left = glowX + 'px';
    glow.style.top = glowY + 'px';

    requestAnimationFrame(updateCursor);
  }

  updateCursor();

  var targets = 'a, button, input, textarea, select, [role="button"], .produto__card, .evento__card';

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

/* =============================================
   SINGLE DOMContentLoaded
============================================= */
document.addEventListener('DOMContentLoaded', function () {
  initGlobalParticles();
  initCustomCursor();
  initNavState();
  initMobileMenu();
  initHero();
  initHeroParallax();
  initManifesto();
  initEvento();
  carregarProximoEvento();
  initProdutos();
  initSobre();
  initFooter();
});
