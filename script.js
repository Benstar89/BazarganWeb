/**
 * Bazargan Web — Premium B2B Website
 * Main JavaScript Module — v2.0
 * Handles: Navigation, Scroll animations, Mobile menu (RTL), Form → Telegram
 */

'use strict';

/* ─── CONFIG: تنظیمات تلگرام ────────────────────────────────────────
   ⚠️  مقادیر زیر رو با اطلاعات ربات خودت جایگزین کن:
   BOT_TOKEN : توکنی که از @BotFather گرفتی
   CHAT_ID   : آیدی عددی چت/کانال/گروهت (با - برای گروه‌ها)
   ─────────────────────────────────────────────────────────────────── */
const TELEGRAM_BOT_TOKEN = '8904929533:AAFLZiZLjNJPrgnW9kVIAiFXjvepBcy7k24';
const TELEGRAM_CHAT_ID   = '5296697243';

/* ─── SECURITY: Rate Limiting ────────────────────────────────────────
   جلوگیری از اسپم فرم — حداکثر 3 ارسال در هر 10 دقیقه
   ─────────────────────────────────────────────────────────────────── */
const RATE_LIMIT_MAX      = 3;      // حداکثر تعداد ارسال
const RATE_LIMIT_WINDOW   = 10 * 60 * 1000; // بازه زمانی: 10 دقیقه (میلی‌ثانیه)

function checkRateLimit() {
  const key       = 'bw_form_submissions';
  const now       = Date.now();
  const stored    = JSON.parse(localStorage.getItem(key) || '[]');
  // فقط ارسال‌های داخل بازه زمانی رو نگه می‌داریم
  const recent    = stored.filter(ts => now - ts < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return false; // بلاک
  recent.push(now);
  localStorage.setItem(key, JSON.stringify(recent));
  return true;
}


/* ─── UTILITY ────────────────────────────────────────────────────── */
function throttle(fn, delay) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ─── STICKY HEADER ──────────────────────────────────────────────── */
function initStickyHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const onScroll = throttle(() => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, 50);

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ─── SMOOTH SCROLL ──────────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#' || targetId === '#!') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();

      const isMobileMenuLink = Boolean(this.closest('#mobile-menu'));
      if (isMobileMenuLink && mobileMenuOpen) {
        closeMobileMenu();
        // Give menu slide-out a slight head start before triggering page scroll
        setTimeout(() => {
          const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 64;
          const top = target.getBoundingClientRect().top + window.scrollY - navH - 12;
          window.scrollTo({ top, behavior: 'smooth' });
        }, 120);
      } else {
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 64;
        const top = target.getBoundingClientRect().top + window.scrollY - navH - 12;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ─── MOBILE MENU ────────────────────────────────────────────────── */
let mobileMenuOpen = false;
let unlockScrollTimeout = null;

function openMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn  = document.getElementById('hamburger-btn');
  if (!menu || !btn) return;

  if (unlockScrollTimeout) {
    clearTimeout(unlockScrollTimeout);
    unlockScrollTimeout = null;
  }

  menu.classList.add('open');
  document.body.classList.add('menu-open');
  btn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  mobileMenuOpen = true;

  // Focus first nav link after transition
  const firstLink = menu.querySelector('.mobile-nav-link');
  if (firstLink) setTimeout(() => firstLink.focus(), 260);
}

function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn  = document.getElementById('hamburger-btn');
  if (!menu || !btn) return;
  if (!mobileMenuOpen) return;

  menu.classList.remove('open');
  btn.setAttribute('aria-expanded', 'false');
  mobileMenuOpen = false;

  // Crucial: keep body overflow locked until the 250ms slide-out animation finishes!
  // Restoring overflow synchronously causes instant layout reflow / GPU stall on mobile devices.
  if (unlockScrollTimeout) clearTimeout(unlockScrollTimeout);
  unlockScrollTimeout = setTimeout(() => {
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    unlockScrollTimeout = null;
  }, 260);
}

function initMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const closeBtn  = document.getElementById('mobile-close-btn');
  const overlay   = document.getElementById('mobile-overlay');
  const menu      = document.getElementById('mobile-menu');

  if (!hamburger || !menu) return;

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileMenuOpen ? closeMobileMenu() : openMobileMenu();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeMobileMenu();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      e.preventDefault();
      closeMobileMenu();
    });
  }

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenuOpen) {
      closeMobileMenu();
      hamburger.focus();
    }
  });

  // Nav links inside menu
  menu.querySelectorAll('.mobile-nav-link, .btn').forEach(link => {
    link.addEventListener('click', () => {
      if (mobileMenuOpen) closeMobileMenu();
    });
  });
}

/* ─── SCROLL REVEAL ──────────────────────────────────────────────── */
function initScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal-up, .reveal-right').forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal-up, .reveal-right').forEach(el => observer.observe(el));
}

/* ─── COUNTER ANIMATION ──────────────────────────────────────────── */
function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const suffix   = el.dataset.suffix || '';
  const duration = 1600;
  const start    = performance.now();

  function ease(t) { return 1 - Math.pow(1 - t, 4); }

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * ease(progress)) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function initCounters() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = '1';
        if (reduced) {
          entry.target.textContent = entry.target.dataset.target + (entry.target.dataset.suffix || '');
        } else {
          animateCounter(entry.target);
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.counter').forEach(c => observer.observe(c));
}

/* ─── ACTIVE NAV TRACKING ────────────────────────────────────────── */
function initActiveNav() {
  const navLinks = document.querySelectorAll('.nav-link');
  const navH = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 64;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.25, rootMargin: `-${navH()}px 0px 0px 0px` });

  document.querySelectorAll('section[id]').forEach(s => observer.observe(s));
}

/* ─── TELEGRAM FORM ──────────────────────────────────────────────── */

/**
 * فیلدهای فرم رو می‌گیره و یه پیام متنی فارسی می‌سازه
 */
function buildTelegramMessage(data) {
  const industryLabels = {
    'trading':      'بازرگانی و تجارت',
    'import-export':'واردات و صادرات',
    'logistics':    'لجستیک',
    'freight':      'فریت‌فوروارد',
    'shipping':     'کشتیرانی',
    'customs':      'گمرک و ترخیص',
    'manufacturing':'تولید و صنعت',
    'wholesale':    'عمده‌فروشی',
    'b2b-services': 'خدمات B2B',
    'other':        'سایر',
  };

  const serviceLabels = {
    'corporate':    'طراحی وب‌سایت سازمانی',
    'b2b':          'طراحی وب‌سایت B2B',
    'multilingual': 'وب‌سایت چندزبانه',
    'redesign':     'بازطراحی وب‌سایت',
    'seo':          'سئو و محتوا',
    'consultation': 'مشاوره دیجیتال',
  };

  const budgetLabels = {
    'under-50m':  'کمتر از ۵۰ میلیون تومان',
    '50-100m':    '۵۰ تا ۱۰۰ میلیون تومان',
    '100-250m':   '۱۰۰ تا ۲۵۰ میلیون تومان',
    '250m-plus':  'بیش از ۲۵۰ میلیون تومان',
    'discuss':    'ترجیح می‌دهم بحث کنیم',
  };

  const now = new Date().toLocaleString('fa-IR', {
    timeZone: 'Asia/Tehran',
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    `📬 *درخواست مشاوره جدید — بازرگان وب*\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 *نام:* ${data.name || '—'}\n` +
    `🏢 *شرکت:* ${data.company || '—'}\n` +
    `📧 *ایمیل:* ${data.email || '—'}\n` +
    `📱 *تلفن/واتساپ:* ${data.phone || '—'}\n\n` +
    `🏭 *صنعت:* ${industryLabels[data.industry] || data.industry || '—'}\n` +
    `🛠 *خدمت مورد نیاز:* ${serviceLabels[data.service] || data.service || '—'}\n` +
    `💰 *بودجه:* ${budgetLabels[data.budget] || data.budget || '—'}\n\n` +
    `💬 *پیام:*\n${data.message || '—'}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `🕐 ${now}`
  );
}

/**
 * ارسال پیام به تلگرام از طریق Bot API
 */
async function sendToTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    throw new Error('BOT_TOKEN_NOT_SET');
  }
  if (!TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID_HERE') {
    throw new Error('CHAT_ID_NOT_SET');
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id:    TELEGRAM_CHAT_ID,
      text:       message,
      parse_mode: 'Markdown',
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.description || `HTTP ${response.status}`);
  }

  return await response.json();
}

/* ─── FORM VALIDATION ────────────────────────────────────────────── */
function validateField(field) {
  const group = field.closest('.form-group');
  const errorEl = group?.querySelector('.form-error');
  let msg = '';

  if (field.required && !field.value.trim()) {
    msg = 'این فیلد الزامی است.';
  } else if (field.type === 'email' && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
    msg = 'آدرس ایمیل معتبر نیست.';
  }

  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.classList.toggle('visible', !!msg);
  }
  field.setAttribute('aria-invalid', String(!!msg));
  return !msg;
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  // Real-time validation
  form.querySelectorAll('[required]').forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', debounce(() => {
      const errorEl = field.closest('.form-group')?.querySelector('.form-error');
      if (errorEl?.classList.contains('visible')) validateField(field);
    }, 300));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // ─ بررسی rate limit ─
    if (!checkRateLimit()) {
      showToast('⏳ تعداد درخواست‌های شما زیاد است. لطفاً ۱۰ دقیقه دیگر تلاش کنید.', 'error');
      return;
    }

    // Validate all required fields
    let valid = true;
    form.querySelectorAll('[required]').forEach(f => { if (!validateField(f)) valid = false; });
    if (!valid) {
      const firstErr = form.querySelector('.form-error.visible');
      firstErr?.closest('.form-group')?.querySelector('input,select,textarea')?.focus();
      return;
    }

    // Gather data
    const data = Object.fromEntries(new FormData(form));

    // UI: loading state
    const btn  = form.querySelector('.form-submit');
    const span = form.querySelector('.submit-text');
    btn.disabled = true;
    if (span) span.textContent = 'در حال ارسال…';

    try {
      const message = buildTelegramMessage(data);
      await sendToTelegram(message);

      showToast('✅ درخواست شما با موفقیت ارسال شد. به زودی با شما تماس می‌گیریم.', 'success');
      form.reset();
      form.querySelectorAll('[aria-invalid]').forEach(f => f.removeAttribute('aria-invalid'));

    } catch (err) {
      console.error('Telegram send error:', err);

      if (err.message === 'BOT_TOKEN_NOT_SET' || err.message === 'CHAT_ID_NOT_SET') {
        showToast('⚠️ تنظیمات تلگرام هنوز انجام نشده. لطفاً با ادمین تماس بگیرید.', 'error');
      } else {
        showToast('❌ خطا در ارسال. لطفاً دوباره تلاش کنید یا مستقیم تماس بگیرید.', 'error');
      }
    } finally {
      btn.disabled = false;
      if (span) span.textContent = 'درخواست مشاوره';
    }
  });
}

/* ─── TOAST ──────────────────────────────────────────────────────── */
function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => toast.classList.remove('show'), 5000);
}

/* ─── PAGE PROGRESS BAR ──────────────────────────────────────────── */
function initPageProgress() {
  const bar = document.createElement('div');
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', 'پیشرفت صفحه');
  bar.style.cssText = [
    'position:fixed', 'top:0', 'right:0', 'left:0', 'height:2px',
    'background:linear-gradient(90deg,#2563EB,#4F46E5,#7C3AED)',
    'transform-origin:right', 'transform:scaleX(0)',
    'z-index:1200', 'transition:transform 0.1s linear',
    'pointer-events:none',
  ].join(';');
  document.body.prepend(bar);

  window.addEventListener('scroll', throttle(() => {
    const ratio = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    bar.style.transform = `scaleX(${Math.min(ratio, 1)})`;
  }, 16), { passive: true });
}

/* ─── GLOBE PAUSE ────────────────────────────────────────────────── */
function initGlobeOptimization() {
  const globe = document.querySelector('.globe-wrapper');
  if (!globe) return;

  const obs = new IntersectionObserver(entries => {
    globe.style.animationPlayState = entries[0].isIntersecting ? 'running' : 'paused';
  }, { threshold: 0.1 });
  obs.observe(globe);
}

/* ─── LAZY IMAGES ────────────────────────────────────────────────── */
function initLazyImages() {
  const imgs = document.querySelectorAll('img[data-src]');
  if ('loading' in HTMLImageElement.prototype) {
    imgs.forEach(img => { img.src = img.dataset.src; img.loading = 'lazy'; });
  } else {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.src = e.target.dataset.src; obs.unobserve(e.target); } });
    }, { rootMargin: '200px' });
    imgs.forEach(img => obs.observe(img));
  }
}

/* ─── RESIZE HANDLER ─────────────────────────────────────────────── */
window.addEventListener('resize', debounce(() => {
  if (window.innerWidth > 1024 && mobileMenuOpen) closeMobileMenu();
}, 200));

/* ─── ACTIVE NAV LINK STYLE INJECTION ───────────────────────────── */
function injectStyles() {
  const s = document.createElement('style');
  s.textContent = `.nav-link.active{color:#fff}.nav-link.active::after{transform:scaleX(1)}`;
  document.head.appendChild(s);
}

/* ─── INIT ALL ───────────────────────────────────────────────────── */
function init() {
  injectStyles();
  initStickyHeader();
  initSmoothScroll();
  initMobileMenu();
  initScrollReveal();
  initCounters();
  initActiveNav();
  initContactForm();
  initLazyImages();
  initGlobeOptimization();
  initPageProgress();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
