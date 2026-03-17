/* =====================================================
   BADAAAS — main.js
   ===================================================== */

(function () {
  'use strict';

  /* ----- Utility ----- */
  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }
  function $$(sel, ctx) {
    return Array.from((ctx || document).querySelectorAll(sel));
  }

  /* =====================================================
     NAV — scroll state + mobile toggle
     ===================================================== */
  (function initNav() {
    var nav       = $('#nav');
    var toggle    = $('.nav-toggle');
    var mobileNav = $('.nav-mobile');
    var mobileLinks = $$('.nav-mobile-links a');

    if (!nav) return;

    // Scroll behaviour
    function onScroll() {
      if (window.scrollY > 20) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile toggle
    if (toggle && mobileNav) {
      toggle.addEventListener('click', function () {
        var isOpen = mobileNav.classList.contains('open');
        mobileNav.classList.toggle('open');
        toggle.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(!isOpen));
      });

      // Close on link click
      mobileLinks.forEach(function (link) {
        link.addEventListener('click', function () {
          mobileNav.classList.remove('open');
          toggle.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // Smooth close on outside click
    document.addEventListener('click', function (e) {
      if (mobileNav && mobileNav.classList.contains('open')) {
        if (!nav.contains(e.target)) {
          mobileNav.classList.remove('open');
          toggle.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  })();

  /* =====================================================
     HERO CANVAS — particle field
     ===================================================== */
  (function initCanvas() {
    var canvas = $('#hero-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var W, H, particles = [], mouse = { x: -9999, y: -9999 };

    var RED = 'rgba(232,49,42,';

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function createParticle() {
      return {
        x:    Math.random() * W,
        y:    Math.random() * H,
        vx:   (Math.random() - 0.5) * 0.4,
        vy:   (Math.random() - 0.5) * 0.4,
        r:    Math.random() * 1.5 + 0.5,
        a:    Math.random() * 0.5 + 0.1,
        isRed: Math.random() < 0.12
      };
    }

    function initParticles() {
      var count = Math.min(Math.floor((W * H) / 12000), 80);
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push(createParticle());
      }
    }

    function drawLine(p1, p2, dist, maxDist) {
      var alpha = (1 - dist / maxDist) * 0.12;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = RED + alpha + ')';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Update + draw particles
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        // Clamp
        p.x = Math.max(0, Math.min(W, p.x));
        p.y = Math.max(0, Math.min(H, p.y));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        if (p.isRed) {
          ctx.fillStyle = RED + p.a + ')';
        } else {
          ctx.fillStyle = 'rgba(255,255,255,' + (p.a * 0.5) + ')';
        }
        ctx.fill();
      });

      // Draw connecting lines
      var maxDist = 140;
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var d  = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) {
            drawLine(particles[i], particles[j], d, maxDist);
          }
        }

        // Mouse proximity
        var mdx = particles[i].x - mouse.x;
        var mdy = particles[i].y - mouse.y;
        var md  = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 120) {
          ctx.beginPath();
          ctx.arc(particles[i].x, particles[i].y, particles[i].r + 1, 0, Math.PI * 2);
          ctx.fillStyle = RED + '0.6)';
          ctx.fill();
        }
      }

      requestAnimationFrame(draw);
    }

    canvas.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    window.addEventListener('resize', function () {
      resize();
      initParticles();
    }, { passive: true });

    resize();
    initParticles();
    draw();
  })();

  /* =====================================================
     HERO COUNTER ANIMATION
     ===================================================== */
  (function initHeroCounters() {
    var stats = $$('.hero-stat .stat-num[data-count]');
    var done  = false;

    function animateCounters() {
      if (done) return;
      done = true;
      stats.forEach(function (el) {
        var target   = parseInt(el.getAttribute('data-count'), 10);
        var duration = 1400;
        var start    = performance.now();

        function step(now) {
          var progress = Math.min((now - start) / duration, 1);
          var ease     = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(ease * target);
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }

    // Trigger after 600ms on load
    setTimeout(animateCounters, 600);
  })();

  /* =====================================================
     INTERSECTION OBSERVER — reveal on scroll
     ===================================================== */
  (function initReveal() {
    if (!window.IntersectionObserver) {
      $$('.reveal').forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // Stagger children reveal
          var card  = entry.target;
          var delay = parseInt(card.getAttribute('data-index') || '0', 10) * 80;
          setTimeout(function () {
            card.classList.add('visible');
          }, delay);
          observer.unobserve(card);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    $$('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  })();

  /* =====================================================
     PROOF BAR COUNTERS
     ===================================================== */
  (function initProofCounters() {
    if (!window.IntersectionObserver) return;

    var counters = $$('.proof-num.counter');
    if (!counters.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el       = entry.target;
        var target   = parseInt(el.getAttribute('data-target'), 10);
        var duration = 1600;
        var start    = performance.now();

        function step(now) {
          var progress = Math.min((now - start) / duration, 1);
          var ease     = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(ease * target);
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) {
      observer.observe(el);
    });
  })();

  /* =====================================================
     TABS — Why BadAAAS
     ===================================================== */
  (function initTabs() {
    var tabBtns   = $$('.tab-btn');
    var tabPanels = $$('.tab-panel');

    if (!tabBtns.length) return;

    function activateTab(tabName) {
      tabBtns.forEach(function (btn) {
        var active = btn.getAttribute('data-tab') === tabName;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', String(active));
      });
      tabPanels.forEach(function (panel) {
        var active = panel.id === 'tab-' + tabName;
        panel.classList.toggle('active', active);

        // Animate bars inside active panel
        if (active) {
          setTimeout(function () {
            $$('.visual-bar-fill', panel).forEach(function (bar) {
              var w = bar.style.width;
              bar.style.width = '0';
              setTimeout(function () { bar.style.width = w; }, 50);
            });
          }, 50);
        }
      });
    }

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activateTab(btn.getAttribute('data-tab'));
      });
    });

    // Initial bar animation
    setTimeout(function () {
      $$('#tab-attraction .visual-bar-fill').forEach(function (bar) {
        var w = bar.style.width;
        bar.style.width = '0';
        setTimeout(function () { bar.style.width = w; }, 100);
      });
    }, 200);
  })();

  /* =====================================================
     LAYERS — interactive
     ===================================================== */
  (function initLayers() {
    var items   = $$('.layer-item');
    var visuals = $$('.layer-visual-item');

    if (!items.length) return;

    function activateLayer(index) {
      items.forEach(function (item, i) {
        item.classList.toggle('active', i === index);
      });
      visuals.forEach(function (v, i) {
        v.classList.toggle('active', i === index);
      });
    }

    items.forEach(function (item) {
      item.addEventListener('click', function () {
        activateLayer(parseInt(item.getAttribute('data-layer'), 10));
      });
    });

    // Auto-cycle
    var current = 0;
    var timer = setInterval(function () {
      current = (current + 1) % items.length;
      activateLayer(current);
    }, 3500);

    items.forEach(function (item) {
      item.addEventListener('click', function () {
        clearInterval(timer);
      });
    });
  })();

  /* =====================================================
     SMOOTH ANCHOR SCROLL
     ===================================================== */
  (function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var target = e.target.closest('a[href^="#"]');
      if (!target) return;

      var id = target.getAttribute('href').slice(1);
      if (!id) return;

      var dest = document.getElementById(id);
      if (!dest) return;

      e.preventDefault();
      var navH = ($('#nav') || {}).offsetHeight || 72;
      var top  = dest.getBoundingClientRect().top + window.scrollY - navH - 16;

      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  })();

  /* =====================================================
     MARQUEE — pause on hover
     ===================================================== */
  (function initMarquee() {
    var inner = $('.logos-inner');
    if (!inner) return;

    inner.addEventListener('mouseenter', function () {
      inner.style.animationPlayState = 'paused';
    });
    inner.addEventListener('mouseleave', function () {
      inner.style.animationPlayState = 'running';
    });
  })();

  /* =====================================================
     SECURITY CARDS — stagger reveal
     ===================================================== */
  (function initSecurityReveal() {
    if (!window.IntersectionObserver) return;

    var cards = $$('.security-card.reveal');
    cards.forEach(function (card, i) {
      card.setAttribute('data-index', i + 1);
    });
  })();

  /* =====================================================
     ACTIVE NAV LINK — highlight on scroll
     ===================================================== */
  (function initActiveNav() {
    var sections = $$('section[id]');
    var links    = $$('.nav-links a[href^="#"]');
    if (!sections.length || !links.length) return;

    var navH = 80;

    function update() {
      var scrollY = window.scrollY + navH + 40;
      var active  = null;

      sections.forEach(function (sec) {
        if (sec.offsetTop <= scrollY) {
          active = sec.id;
        }
      });

      links.forEach(function (link) {
        var href = link.getAttribute('href').slice(1);
        link.style.color = (href === active) ? 'var(--white)' : '';
      });
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  })();

  /* =====================================================
     CASE CARD HOVER — subtle tilt
     ===================================================== */
  (function initTilt() {
    var cards = $$('.case-card');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect  = card.getBoundingClientRect();
        var cx    = rect.left + rect.width  / 2;
        var cy    = rect.top  + rect.height / 2;
        var dx    = (e.clientX - cx) / (rect.width  / 2);
        var dy    = (e.clientY - cy) / (rect.height / 2);
        var rotX  =  dy * -4;
        var rotY  =  dx *  4;
        card.style.transform = 'translateY(-4px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
        card.style.transition = 'transform 0.1s ease';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
        card.style.transition = 'all 0.3s ease';
      });
    });
  })();

  /* =====================================================
     SERVICE CARD STAGGER
     ===================================================== */
  (function initServiceStagger() {
    var cards = $$('.service-card.reveal');
    cards.forEach(function (card, i) {
      if (!card.getAttribute('data-index')) {
        card.setAttribute('data-index', i + 1);
      }
    });
  })();

})();
