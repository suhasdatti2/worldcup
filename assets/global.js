/* ============================================================
   NOVORA — Theme JS (vanilla, no dependencies)
   ============================================================ */
(function () {
  'use strict';
  const T = window.theme || {};
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const on = (el, ev, fn, o) => el && el.addEventListener(ev, fn, o);

  /* ---------- Money ---------- */
  function formatMoney(cents) {
    const fmt = T.moneyFormat || '${{amount}}';
    const value = (cents / 100);
    function withCommas(num, decimals) {
      const parts = num.toFixed(decimals).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) => {
      switch (key) {
        case 'amount': return withCommas(value, 2);
        case 'amount_no_decimals': return withCommas(value, 0);
        case 'amount_with_comma_separator': return withCommas(value, 2).replace(/,/g, '·').replace(/\./g, ',').replace(/·/g, '.');
        case 'amount_no_decimals_with_comma_separator': return withCommas(value, 0).replace(/,/g, '.');
        default: return withCommas(value, 2);
      }
    });
  }

  /* ---------- Scroll lock + drawer helpers ---------- */
  let lastFocus = null;
  function lockScroll() { document.body.classList.add('scroll-locked'); }
  function unlockScroll() { if (!$('.drawer.is-open') && !$('.popup.is-open')) document.body.classList.remove('scroll-locked'); }

  function openDrawer(drawer, overlay) {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    if (overlay) overlay.classList.add('is-open');
    lockScroll();
    const focusable = drawer.querySelector('input, button, a');
    if (focusable) setTimeout(() => focusable.focus(), 60);
  }
  function closeDrawer(drawer, overlay) {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
    unlockScroll();
    if (lastFocus) lastFocus.focus();
  }

  /* ---------- Header scroll state ---------- */
  (function header() {
    const wrap = $('[data-header]');
    if (!wrap) return;
    const onScroll = () => {
      const y = window.scrollY;
      wrap.classList.toggle('is-scrolled', y > 10);
      if (wrap.dataset.transparent === 'true') {
        wrap.dataset.transparent = y > window.innerHeight * 0.7 ? 'solid' : 'true';
      } else if (wrap.dataset.transparent === 'solid' && y <= window.innerHeight * 0.7) {
        wrap.dataset.transparent = 'true';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ---------- Announcement rotator ---------- */
  (function announcement() {
    const root = $('[data-announcement]');
    if (!root) return;
    const slides = $$('[data-ann-slide]', root);
    if (slides.length < 2) return;
    let i = 0;
    const show = (n) => { slides.forEach((s, k) => s.classList.toggle('is-active', k === n)); };
    const next = () => { i = (i + 1) % slides.length; show(i); };
    const prev = () => { i = (i - 1 + slides.length) % slides.length; show(i); };
    let timer = setInterval(next, 5000);
    on($('[data-ann-next]', root), 'click', () => { next(); reset(); });
    on($('[data-ann-prev]', root), 'click', () => { prev(); reset(); });
    function reset() { clearInterval(timer); timer = setInterval(next, 5000); }
  })();

  /* ---------- Mobile menu / search / cart triggers ---------- */
  function wireDrawer(openSel, drawerSel, overlaySel, closeSel) {
    const drawer = $(drawerSel);
    const overlay = $(overlaySel);
    $$(openSel).forEach(btn => on(btn, 'click', (e) => { e.preventDefault(); openDrawer(drawer, overlay); }));
    $$(closeSel).forEach(btn => on(btn, 'click', () => closeDrawer(drawer, overlay)));
    on(overlay, 'click', () => closeDrawer(drawer, overlay));
    return { drawer, overlay };
  }
  wireDrawer('[data-open-menu]', '[data-mobile-menu]', '[data-menu-overlay]', '[data-close-menu]');
  const searchRefs = wireDrawer('[data-open-search]', '[data-search-drawer]', '[data-search-overlay]', '[data-close-search]');
  const cartRefs = wireDrawer('[data-open-cart]', '[data-cart-drawer]', '[data-cart-overlay]', '[data-close-cart]');

  on(searchRefs.drawer ? document : null, 'keydown', () => {});
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $$('.drawer.is-open').forEach(d => closeDrawer(d, d.parentElement.querySelector('.overlay')));
      $$('.popup.is-open').forEach(p => p.classList.remove('is-open'));
      unlockScroll();
    }
  });

  /* ---------- Open cart helper ---------- */
  function openCart() {
    if (T.cartType === 'drawer' && cartRefs.drawer) openDrawer(cartRefs.drawer, cartRefs.overlay);
    else window.location.href = T.routes.cart;
  }

  /* ---------- Cart rendering ---------- */
  function updateCartCount(count) {
    $$('[data-cart-count]').forEach(el => { el.textContent = count; el.hidden = count === 0; });
    $$('[data-cart-count-text]').forEach(el => el.textContent = '(' + count + ')');
  }

  function freeShipBar(totalCents) {
    if (!T.freeShipBar) return;
    const threshold = T.freeShipThreshold;
    $$('[data-fsb]').forEach(bar => {
      const fill = $('[data-fsb-fill]', bar);
      const text = $('[data-fsb-text]', bar);
      const remaining = threshold - totalCents;
      const pct = Math.min(100, (totalCents / threshold) * 100);
      if (fill) fill.style.width = pct + '%';
      if (text) {
        text.innerHTML = remaining <= 0
          ? '🎉 You’ve unlocked <strong>FREE shipping!</strong>'
          : 'You’re <strong>' + formatMoney(remaining) + '</strong> away from FREE shipping';
      }
    });
  }

  function renderCartItems(cart) {
    const container = $('[data-cart-items]');
    if (!container) return;
    if (cart.item_count === 0) {
      container.innerHTML = '<div class="cart-empty" data-cart-empty><h3>Your cart is empty</h3><p style="color:var(--color-muted);">Your kit bag is waiting to be filled.</p><button class="btn btn--gold" data-close-cart style="margin-top:8px;">Continue shopping</button></div>';
      $$('[data-cart-footer]').forEach(f => f.hidden = true);
      on($('[data-close-cart]', container), 'click', () => closeDrawer(cartRefs.drawer, cartRefs.overlay));
      return;
    }
    $$('[data-cart-footer]').forEach(f => f.hidden = false);
    container.innerHTML = cart.items.map((item, idx) => {
      const img = item.image ? item.image.replace(/(\.[a-z]+)(\?|$)/i, '_168x$1$2') : '';
      const variant = (item.product_has_only_default_variant) ? '' : '<div class="cart-item__variant">' + item.variant_title + '</div>';
      return '<div class="cart-item" data-cart-item data-key="' + item.key + '" data-line="' + (idx + 1) + '">' +
        '<a href="' + item.url + '" class="cart-item__media">' + (img ? '<img src="' + img + '" alt="" loading="lazy">' : '') + '</a>' +
        '<div class="cart-item__details">' +
          '<div class="cart-item__title">' + item.product_title + '</div>' + variant +
          '<div class="cart-item__qty" data-qty-wrap>' +
            '<button type="button" data-qty-down aria-label="Decrease">&minus;</button>' +
            '<span data-qty>' + item.quantity + '</span>' +
            '<button type="button" data-qty-up aria-label="Increase">+</button>' +
          '</div>' +
        '</div>' +
        '<div><div class="cart-item__price">' + formatMoney(item.final_line_price) + '</div>' +
        '<button type="button" class="cart-item__remove" data-remove>Remove</button></div>' +
      '</div>';
    }).join('');
    $$('[data-cart-subtotal]').forEach(el => el.textContent = formatMoney(cart.total_price));
  }

  function refreshCart(open) {
    return fetch(T.routes.cart + '.js', { headers: { 'Accept': 'application/json' } })
      .then(r => r.json())
      .then(cart => {
        updateCartCount(cart.item_count);
        renderCartItems(cart);
        freeShipBar(cart.total_price);
        if (open) openCart();
        return cart;
      });
  }

  function changeLine(key, quantity) {
    return fetch(T.routes.cartChange, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: key, quantity: quantity })
    }).then(r => r.json()).then(cart => {
      updateCartCount(cart.item_count);
      renderCartItems(cart);
      freeShipBar(cart.total_price);
      return cart;
    });
  }

  /* qty + remove delegation */
  on(document, 'click', (e) => {
    const item = e.target.closest('[data-cart-item]');
    if (!item) return;
    const key = item.dataset.key;
    const qtyEl = $('[data-qty]', item);
    const current = qtyEl ? parseInt(qtyEl.textContent, 10) : 1;
    if (e.target.closest('[data-qty-up]')) changeLine(key, current + 1);
    else if (e.target.closest('[data-qty-down]')) changeLine(key, current - 1);
    else if (e.target.closest('[data-remove]')) changeLine(key, 0);
  });

  /* ---------- Add to cart ---------- */
  function miniToast(msg) {
    const toast = $('#MiniToast');
    if (!toast) return;
    $('#MiniToastText').textContent = msg || T.strings.addedToCart || 'Added to cart';
    toast.classList.add('is-visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  function addToCart(items, btn) {
    if (btn) { btn.classList.add('is-loading'); btn.disabled = true; }
    return fetch(T.routes.cartAdd, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ items: items })
    }).then(r => r.json()).then(data => {
      if (data.status) { miniToast(data.description || 'Could not add'); return data; }
      miniToast();
      refreshCart(true);
      return data;
    }).finally(() => { if (btn) { btn.classList.remove('is-loading'); btn.disabled = false; } });
  }

  /* quick add buttons (cards + upsell) */
  on(document, 'click', (e) => {
    const qa = e.target.closest('[data-quick-add]');
    if (!qa) return;
    e.preventDefault();
    addToCart([{ id: qa.dataset.variantId, quantity: 1 }], qa);
  });

  /* ---------- Product page ---------- */
  (function product() {
    const root = $('[data-section-type="product"]');
    if (!root) return;
    let variants = [];
    try { variants = JSON.parse($('[data-product-json]').textContent); } catch (e) {}

    const form = $('#ProductForm');
    const idInput = $('[data-variant-id]', form);
    const atc = $('[data-atc]', form);
    const atcText = $('[data-atc-text]', form);
    const priceBlock = $('[data-price-block]');
    const stickyPrice = $('[data-sticky-price]');

    function getSelectedOptions() {
      const opts = [];
      $$('[data-option-value] input:checked', form).forEach(input => {
        const pos = parseInt(input.closest('[data-option-value]').dataset.optionPosition, 10);
        opts[pos - 1] = input.value;
      });
      return opts;
    }

    function findVariant(opts) {
      return variants.find(v => v.options.every((o, i) => o === opts[i]));
    }

    function updateVariant() {
      const opts = getSelectedOptions();
      const variant = findVariant(opts) || variants[0];
      if (!variant) return;
      idInput.value = variant.id;
      // selected labels
      $$('[data-selected-option]').forEach((el, i) => { if (opts[i]) el.textContent = opts[i]; });
      // price
      if (priceBlock) {
        let html = '<div class="product__price-row"><span class="product__price' + (variant.compare_at_price > variant.price ? ' product__price--sale' : '') + '">' + formatMoney(variant.price) + '</span>';
        if (variant.compare_at_price > variant.price) {
          html += '<span class="product__price-compare">' + formatMoney(variant.compare_at_price) + '</span>';
          html += '<span class="product__save">Save ' + formatMoney(variant.compare_at_price - variant.price) + '</span>';
        }
        html += '</div>';
        priceBlock.innerHTML = html;
      }
      if (stickyPrice) stickyPrice.textContent = formatMoney(variant.price);
      // availability
      if (variant.available) { atc.disabled = false; atcText.textContent = T.strings.addedToCart ? 'Add to Cart' : 'Add to Cart'; }
      else { atc.disabled = true; atcText.textContent = T.strings.soldOut || 'Sold Out'; }
      // gallery jump to variant media
      if (variant.featured_media) jumpTo(variant.featured_media.position - 1);
      // update URL
      if (history.replaceState) {
        const url = new URL(window.location);
        url.searchParams.set('variant', variant.id);
        history.replaceState({}, '', url);
      }
    }

    $$('[data-option-value] input', form).forEach(input => on(input, 'change', () => {
      const wrap = input.closest('.variant');
      if (wrap) $$('.size-swatch, .color-swatch', wrap).forEach(s => s.classList.remove('is-active'));
      input.closest('label').classList.add('is-active');
      updateVariant();
    }));

    /* submit */
    on(form, 'submit', (e) => {
      e.preventDefault();
      const qty = parseInt($('[data-qty-input]', form).value, 10) || 1;
      addToCart([{ id: idInput.value, quantity: qty }], atc);
    });

    /* qty */
    const qtyInput = $('[data-qty-input]', form);
    on($('[data-qty-plus]', form), 'click', () => { qtyInput.value = (parseInt(qtyInput.value, 10) || 1) + 1; });
    on($('[data-qty-minus]', form), 'click', () => { qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1); });

    /* gallery */
    const main = $('[data-gallery-main]');
    const thumbs = $$('[data-thumb]');
    function jumpTo(idx) {
      const slide = $('[data-slide="' + idx + '"]', main);
      if (slide && main) main.scrollTo({ left: slide.offsetLeft - main.offsetLeft, behavior: 'smooth' });
      thumbs.forEach(t => t.classList.toggle('is-active', parseInt(t.dataset.thumb, 10) === idx));
    }
    thumbs.forEach(t => on(t, 'click', () => jumpTo(parseInt(t.dataset.thumb, 10))));
    if (main) {
      let st;
      on(main, 'scroll', () => {
        clearTimeout(st);
        st = setTimeout(() => {
          const idx = Math.round(main.scrollLeft / main.clientWidth);
          thumbs.forEach(t => t.classList.toggle('is-active', parseInt(t.dataset.thumb, 10) === idx));
        }, 80);
      }, { passive: true });
    }

    /* zoom on hover */
    $$('[data-zoom]').forEach(slide => {
      const img = slide.querySelector('img');
      if (!img) return;
      on(slide, 'mousemove', (e) => {
        const r = slide.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        img.style.transformOrigin = x + '% ' + y + '%';
        img.style.transform = 'scale(1.8)';
      });
      on(slide, 'mouseleave', () => { img.style.transform = ''; });
    });

    /* sticky ATC */
    const sticky = $('[data-sticky-atc]');
    const stickyBtn = $('[data-sticky-atc-btn]');
    if (sticky && atc) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => sticky.classList.toggle('is-visible', !en.isIntersecting && window.scrollY > 600));
      }, { rootMargin: '-80px 0px 0px 0px' });
      io.observe(atc);
      on(stickyBtn, 'click', () => {
        const qty = parseInt(qtyInput.value, 10) || 1;
        addToCart([{ id: idInput.value, quantity: qty }], stickyBtn);
      });
    }

    /* bundle tiers */
    $$('[data-bundle]').forEach(tier => on(tier, 'click', () => {
      $$('[data-bundle]').forEach(t => t.classList.remove('is-active'));
      tier.classList.add('is-active');
      qtyInput.value = tier.dataset.qty;
    }));

    /* live visitors flicker */
    const lv = $('[data-live-visitors]');
    if (lv) setInterval(() => { lv.textContent = 10 + Math.floor(Math.random() * 22); }, 5000);

    /* track recently viewed */
    try {
      const titleEl = $('.product__title');
      const imgEl = $('[data-sticky-atc] img') || $('.gallery__slide img');
      const item = {
        url: window.location.pathname,
        title: titleEl ? titleEl.textContent.trim() : document.title,
        image: imgEl ? imgEl.currentSrc || imgEl.src : '',
        price: stickyPrice ? stickyPrice.textContent : ''
      };
      let rv = JSON.parse(localStorage.getItem('novora_rv') || '[]').filter(p => p.url !== item.url);
      rv.unshift(item);
      localStorage.setItem('novora_rv', JSON.stringify(rv.slice(0, 8)));
    } catch (e) {}

    updateVariant();
  })();

  /* ---------- Frequently bought together ---------- */
  (function fbt() {
    const root = $('[data-fbt]');
    if (!root) return;
    function recalc() {
      let total = 0, count = 0;
      $$('[data-fbt-item]', root).forEach(it => {
        const check = $('[data-fbt-check]', it);
        if (!check || check.checked) { total += parseInt(it.dataset.price, 10); count++; }
      });
      $('[data-fbt-total]').textContent = formatMoney(total);
      $('[data-fbt-count]').textContent = count;
    }
    $$('[data-fbt-check]', root).forEach(c => on(c, 'change', recalc));
    on($('[data-fbt-add]'), 'click', (e) => {
      const items = [];
      $$('[data-fbt-item]', root).forEach(it => {
        const check = $('[data-fbt-check]', it);
        if (!check || check.checked) items.push({ id: it.dataset.variant, quantity: 1 });
      });
      if (items.length) addToCart(items, e.currentTarget);
    });
    recalc();
  })();

  /* ---------- Accordion ---------- */
  $$('[data-accordion] .accordion__trigger').forEach(trigger => {
    const panel = trigger.nextElementSibling;
    if (trigger.getAttribute('aria-expanded') === 'true') panel.style.maxHeight = panel.scrollHeight + 'px';
    on(trigger, 'click', () => {
      const open = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!open));
      panel.style.maxHeight = open ? '0px' : panel.scrollHeight + 'px';
    });
  });
  $$('[data-open-accordion]').forEach(link => on(link, 'click', (e) => {
    e.preventDefault();
    const target = $('#' + link.dataset.openAccordion);
    if (!target) return;
    const trigger = $('.accordion__trigger', target);
    if (trigger && trigger.getAttribute('aria-expanded') === 'false') trigger.click();
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));

  /* ---------- Countdown ---------- */
  $$('[data-countdown]').forEach(cd => {
    let target;
    if (cd.dataset.deadline) {
      target = new Date(cd.dataset.deadline.replace(' ', 'T')).getTime();
    } else {
      const hours = parseInt(cd.dataset.durationHours, 10) || 24;
      const key = 'novora_cd_' + (hours);
      let start = parseInt(localStorage.getItem(key), 10);
      if (!start || start < Date.now()) { start = Date.now() + hours * 3600 * 1000; localStorage.setItem(key, start); }
      target = start;
    }
    const d = $('[data-cd-days]', cd), h = $('[data-cd-hours]', cd), m = $('[data-cd-mins]', cd), s = $('[data-cd-secs]', cd);
    function tick() {
      let diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / 86400000); diff -= days * 86400000;
      const hrs = Math.floor(diff / 3600000); diff -= hrs * 3600000;
      const mins = Math.floor(diff / 60000); diff -= mins * 60000;
      const secs = Math.floor(diff / 1000);
      const pad = n => String(n).padStart(2, '0');
      if (d) d.textContent = pad(days);
      if (h) h.textContent = pad(hrs);
      if (m) m.textContent = pad(mins);
      if (s) s.textContent = pad(secs);
    }
    tick();
    setInterval(tick, 1000);
  });

  /* ---------- Delivery-by date ---------- */
  $$('[data-ship-date]').forEach(el => {
    const d = new Date(Date.now() + 6 * 86400000);
    el.textContent = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  });

  /* ---------- Shipping timer (rolling) ---------- */
  $$('[data-ship-timer]').forEach(el => {
    function tick() {
      const now = new Date();
      const end = new Date(); end.setHours(23, 59, 59);
      let diff = Math.max(0, end - now);
      const h = Math.floor(diff / 3600000); diff -= h * 3600000;
      const m = Math.floor(diff / 60000); diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      const pad = n => String(n).padStart(2, '0');
      el.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
    }
    tick(); setInterval(tick, 1000);
  });

  /* ---------- Predictive search ---------- */
  (function search() {
    const input = $('[data-predictive-input]');
    if (!input) return;
    const results = $('[data-predictive-results]');
    const def = $('[data-predictive-default]');
    let timer;
    on(input, 'input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length < 2) { results.innerHTML = ''; if (def) def.style.display = ''; return; }
      timer = setTimeout(() => {
        fetch('/search/suggest.json?q=' + encodeURIComponent(q) + '&resources[type]=product&resources[limit]=6')
          .then(r => r.json())
          .then(data => {
            if (def) def.style.display = 'none';
            const products = (data.resources.results.products || []);
            if (!products.length) { results.innerHTML = '<p style="color:var(--color-muted);padding:14px;">No results for “' + q + '”.</p>'; return; }
            results.innerHTML = products.map(p => {
              const img = p.featured_image && p.featured_image.url ? p.featured_image.url.replace(/(\.[a-z]+)(\?|$)/i, '_112x$1$2') : '';
              return '<a href="' + p.url + '" class="search-result">' +
                '<div class="search-result__media">' + (img ? '<img src="' + img + '" alt="">' : '') + '</div>' +
                '<div><div class="search-result__title">' + p.title + '</div><div class="search-result__price">' + (p.price ? formatMoney(parseInt(p.price, 10) || (p.price * 100)) : '') + '</div></div>' +
              '</a>';
            }).join('');
          }).catch(() => {});
      }, 220);
    });
  })();

  /* ---------- Newsletter popup + exit intent ---------- */
  (function popup() {
    const pop = $('[data-newsletter-popup]');
    if (!pop) return;
    const seen = localStorage.getItem('novora_nl_seen');
    function show() { if (localStorage.getItem('novora_nl_seen')) return; pop.classList.add('is-open'); lockScroll(); }
    function hide() { pop.classList.remove('is-open'); unlockScroll(); localStorage.setItem('novora_nl_seen', '1'); }
    if (!seen) {
      const delay = (parseInt(pop.dataset.delay, 10) || 6) * 1000;
      setTimeout(show, delay);
      document.addEventListener('mouseout', function exit(e) {
        if (e.clientY <= 0 && !localStorage.getItem('novora_nl_seen')) { show(); document.removeEventListener('mouseout', exit); }
      });
    }
    $$('[data-popup-close]', pop).forEach(b => on(b, 'click', hide));
    const f = pop.querySelector('form');
    on(f, 'submit', () => {
      localStorage.setItem('novora_nl_seen', '1');
      const fw = $('[data-popup-form]', pop), sw = $('[data-popup-success]', pop);
      if (fw && sw) { setTimeout(() => { fw.hidden = true; sw.hidden = false; }, 50); }
    });
  })();

  /* ---------- Recent purchase toasts ---------- */
  (function recent() {
    const toast = $('[data-recent-toast]');
    const dataEl = $('[data-recent-data]');
    if (!toast || !dataEl) return;
    let data = [];
    try { data = JSON.parse(dataEl.textContent); } catch (e) {}
    if (!data.length) return;
    let i = 0, dismissed = false;
    on($('[data-rt-close]', toast), 'click', () => { dismissed = true; toast.classList.remove('is-visible'); });
    function showNext() {
      if (dismissed) return;
      const d = data[i % data.length]; i++;
      const media = $('[data-rt-media]', toast);
      const img = d.image ? d.image.replace(/(\.[a-z]+)(\?|$)/i, '_100x$1$2') : '';
      media.innerHTML = img ? '<img src="' + img + '" alt="">' : '';
      $('[data-rt-text]', toast).innerHTML = '<strong>' + d.name + '</strong> bought ' + d.product;
      $('[data-rt-time]', toast).textContent = d.mins + ' mins ago';
      toast.classList.add('is-visible');
      setTimeout(() => toast.classList.remove('is-visible'), 5000);
      setTimeout(showNext, 5000 + 8000 + Math.random() * 6000);
    }
    setTimeout(showNext, 9000);
  })();

  /* ---------- Wishlist ---------- */
  (function wishlist() {
    function get() { try { return JSON.parse(localStorage.getItem('novora_wl') || '[]'); } catch (e) { return []; } }
    function set(a) { localStorage.setItem('novora_wl', JSON.stringify(a)); updateCount(a); }
    function updateCount(a) { $$('[data-wishlist-count]').forEach(el => { el.textContent = a.length; el.hidden = a.length === 0; }); }
    function paint() {
      const wl = get();
      $$('[data-wishlist]').forEach(btn => btn.classList.toggle('is-active', wl.includes(btn.dataset.productHandle)));
      updateCount(wl);
    }
    on(document, 'click', (e) => {
      const btn = e.target.closest('[data-wishlist]');
      if (!btn) return;
      e.preventDefault();
      let wl = get();
      const h = btn.dataset.productHandle;
      if (wl.includes(h)) wl = wl.filter(x => x !== h); else wl.push(h);
      set(wl);
      btn.classList.toggle('is-active');
    });
    paint();
  })();

  /* ---------- Recently viewed render ---------- */
  (function recentlyViewed() {
    const section = $('[data-recently-viewed]');
    if (!section) return;
    let rv = [];
    try { rv = JSON.parse(localStorage.getItem('novora_rv') || '[]'); } catch (e) {}
    const here = window.location.pathname;
    rv = rv.filter(p => p.url !== here);
    if (!rv.length) return;
    const list = $('[data-rv-list]', section);
    list.innerHTML = rv.slice(0, 8).map(p =>
      '<div class="product-card" style="flex:0 0 clamp(200px,24vw,260px);">' +
        '<a href="' + p.url + '" class="product-card__media">' + (p.image ? '<img src="' + p.image + '" alt="" loading="lazy">' : '') + '</a>' +
        '<div class="product-card__info"><h3 class="product-card__title"><a href="' + p.url + '">' + p.title + '</a></h3>' +
        '<div class="product-card__price-row"><span class="product-card__price">' + p.price + '</span></div></div>' +
      '</div>'
    ).join('');
    section.hidden = false;
  })();

  /* ---------- Customer login/recover toggle ---------- */
  (function customer() {
    const login = $('[data-customer-login]'), recover = $('[data-customer-recover]');
    if (login && recover) {
      on($('[data-show-recover]'), 'click', (e) => { e.preventDefault(); login.hidden = true; recover.hidden = false; });
      on($('[data-show-login]'), 'click', (e) => { e.preventDefault(); recover.hidden = true; login.hidden = false; });
      if (window.location.hash === '#recover') { login.hidden = true; recover.hidden = false; }
    }
    const toggleAddr = $('[data-toggle-new-address]'), newAddr = $('[data-new-address]');
    if (toggleAddr && newAddr) on(toggleAddr, 'click', () => { newAddr.hidden = !newAddr.hidden; });
  })();

  /* ---------- Scroll reveal + lazy fade ---------- */
  (function reveal() {
    if (document.documentElement.classList.contains('no-anim')) {
      $$('.reveal').forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    $$('.reveal').forEach(el => io.observe(el));
  })();

  $$('img.lazy-img').forEach(img => {
    if (img.complete) img.classList.add('is-loaded');
    else on(img, 'load', () => img.classList.add('is-loaded'));
  });

  /* ---------- Shopify editor support ---------- */
  if (window.Shopify && window.Shopify.designMode) {
    document.addEventListener('shopify:section:load', () => {
      $$('.reveal').forEach(el => el.classList.add('is-visible'));
    });
  }

  /* initial cart sync */
  refreshCart(false);
})();
