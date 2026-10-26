/* Clear Skin: animations and interaction. No libraries. */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* 1. Scroll reveal, staggered by order within a group */
  var revealEls = $$('.reveal');
  revealEls.forEach(function (el) {
    var siblings = $$('.reveal', el.parentElement);
    el.style.setProperty('--rd', (siblings.indexOf(el) % 6) * 90 + 'ms');
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* 2. Header, progress, parallax and steps line on one rAF */
  var nav = $('#nav');
  var bar = $('.progress span');
  var parallaxEls = $$('[data-parallax]');
  var stepsEl = $('#steps');
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    nav.classList.toggle('is-scrolled', y > 10);
    if (y > lastY && y > 240) nav.classList.add('is-hidden');
    else nav.classList.remove('is-hidden');
    lastY = y;

    if (!reduce) {
      parallaxEls.forEach(function (el) {
        var k = parseFloat(el.getAttribute('data-parallax')) || 0.05;
        el.style.setProperty('--py', (-y * k).toFixed(1) + 'px');
      });
    }
    if (stepsEl) {
      var r = stepsEl.getBoundingClientRect();
      var p = (window.innerHeight * 0.75 - r.top) / (r.height + 80);
      stepsEl.style.setProperty('--line-p', Math.max(0, Math.min(1, p)).toFixed(3));
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* 3. Cursor glow across the page */
  var glow = $('.glow');
  if (finePointer && !reduce && glow) {
    window.addEventListener('pointermove', function (e) {
      glow.style.setProperty('--gx', e.clientX + 'px');
      glow.style.setProperty('--gy', e.clientY + 'px');
    }, { passive: true });
  } else if (glow) {
    glow.style.display = 'none';
  }

  /* 4. Magnetic buttons: pulled toward the cursor, ease back */
  if (finePointer && !reduce) {
    $$('[data-magnetic]').forEach(function (btn) {
      var strength = 0.28;
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.transition = 'color .35s, border-color .35s';
        btn.style.transform = 'translate(' + (dx * strength).toFixed(1) + 'px,' + (dy * strength).toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1), color .35s, border-color .35s';
        btn.style.transform = '';
      });
    });
  }

  /* 5. Cards: tilt toward the cursor and a light spot */
  $$('[data-tilt]').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');
      if (!reduce && finePointer) {
        card.style.setProperty('--ry', ((x / r.width - 0.5) * 8).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y / r.height) * 8).toFixed(2) + 'deg');
      }
    });
    card.addEventListener('pointerleave', function () {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });

  /* 6. Counters */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = target + suffix; return; }
    var dur = 1400;
    var start = null;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  } else {
    counters.forEach(animateCount);
  }

  /* 7. Tabs: the pill slides to the active tab */
  var tabs = $$('.tab');
  var panels = $$('.panel');
  var pill = $('.tabs__pill');

  function movePill(tab) {
    if (!pill || !tab) return;
    pill.style.setProperty('--tx', tab.offsetLeft + 'px');
    pill.style.setProperty('--tw', tab.offsetWidth + 'px');
  }
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p) { p.classList.toggle('is-active', p.id === 'panel-' + tab.getAttribute('data-tab')); });
    movePill(tab);
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (n) { n.focus(); selectTab(n); e.preventDefault(); }
    });
  });
  var firstTab = $('.tab.is-active');
  movePill(firstTab);
  window.addEventListener('resize', function () { movePill($('.tab.is-active')); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { movePill($('.tab.is-active')); });
  }

  /* 8. Price accordion */
  $$('.acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement;
      var open = !item.classList.contains('is-open');
      $$('.acc__item').forEach(function (it) {
        it.classList.remove('is-open');
        $('.acc__btn', it).setAttribute('aria-expanded', 'false');
      });
      if (open) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* 9. Booking form: validation and a nice confirmation */
  var form = $('#form');
  var err = $('#form-err');
  var done = $('#done');

  function bad(input, msg) {
    input.parentElement.classList.add('is-bad');
    err.textContent = msg;
    input.focus();
  }
  if (form) {
    $$('input', form).forEach(function (i) {
      i.addEventListener('input', function () { i.parentElement.classList.remove('is-bad'); err.textContent = ''; });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#f-name').value.trim();
      var tel = $('#f-tel').value.replace(/\D/g, '');
      if (name.length < 2) return bad($('#f-name'), 'Please enter your name.');
      if (tel.length < 8) return bad($('#f-tel'), 'Please check your phone number.');
      $('#done-title').textContent = name + ', your request is received';
      $('#done-text').textContent = 'Treatment: ' + $('#f-service').value + '. I will message the number you left to agree on a time.';
      form.hidden = true;
      done.hidden = false;
    });
    $('#again').addEventListener('click', function () {
      form.reset();
      form.hidden = false;
      done.hidden = true;
      err.textContent = '';
    });
  }
})();
