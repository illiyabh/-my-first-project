/* ============================================================================
   میالویی — اسکریپت اصلی سایت
   ----------------------------------------------------------------------------
   بخش‌ها:
   ۱) تغییر ظاهر هدر هنگام اسکرول
   ۲) اسکراب ویدیوی هیرو با اسکرول (جلو و عقب)
   ۳) منوی موبایل
   ۴) پنجره فرم مشاوره + پیام موفقیت
   ۵) انیمیشن ظاهرشدن بخش‌ها
   ============================================================================ */

(function () {
  'use strict';

  /* ==========================================================================
     ۱) هدر: پس از کمی اسکرول، پس‌زمینه شیشه‌ای می‌گیرد
     ========================================================================== */
  const header = document.getElementById('siteHeader');

  function updateHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();


  /* ==========================================================================
     ۲) ویدیوی هیرو: با اسکرول جلو و عقب می‌رود
     بخش هیرو ۲۵۰٪ ارتفاع صفحه است و تصویرش چسبان می‌ماند؛
     پس فاصله اسکرول = ارتفاع هیرو − ارتفاع صفحه.
     ========================================================================== */
  const hero = document.querySelector('.hero');
  const video = document.getElementById('heroVideo');

  if (hero && video) {
    let duration = 0;       // طول ویدیو (ثانیه)
    let target = 0;         // زمان هدف (بر اساس اسکرول)
    let current = 0;        // زمان فعلی (نرم‌شده)
    let heroVisible = true; // فقط وقتی هیرو در دید است محاسبه شود

    function setDuration() {
      duration = video.duration || 0;
    }
    video.addEventListener('loadedmetadata', function () {
      setDuration();
      // نمایش فریم اول در مرورگرهایی که تا اولین جست‌وجو تصویر نشان نمی‌دهند
      try { video.currentTime = 0.001; } catch (e) {}
      updateTarget();
    });
    video.addEventListener('loadeddata', function () { if (!duration) setDuration(); });

    // محاسبه زمان هدف بر اساس موقعیت اسکرول
    function updateTarget() {
      if (!duration) return;
      const scrollable = hero.offsetHeight - window.innerHeight;
      if (scrollable <= 0) { target = 0; return; }
      const rect = hero.getBoundingClientRect();
      const progress = Math.min(Math.max(-rect.top / scrollable, 0), 1);
      const end = Math.max(0, duration - 0.05); // کمی قبل از پایان تا فریم آخر سالم بماند
      target = progress * end;
    }

    window.addEventListener('scroll', updateTarget, { passive: true });
    window.addEventListener('resize', updateTarget);

    // فقط وقتی هیرو در دید است محاسبه انجام شود (بهینه‌سازی)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(hero);
    }

    // حلقه انیمیشن با میان‌یابی نرم بین زمان فعلی و زمان هدف
    function tick() {
      if (heroVisible && duration && document.visibilityState === 'visible') {
        current += (target - current) * 0.12;          // میان‌یابی نرم
        if (Math.abs(target - current) < 0.02) current = target;
        if (Math.abs(video.currentTime - current) > 0.02) {
          try { video.currentTime = current; } catch (e) {}
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    updateTarget();
  }


  /* ==========================================================================
     ۳) منوی موبایل
     ========================================================================== */
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // بستن منو پس از انتخاب هر لینک
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }


  /* ==========================================================================
     ۴) پنجره فرم مشاوره
     ========================================================================== */
  const modal = document.getElementById('consultModal');
  const form = document.getElementById('consultForm');
  const success = document.getElementById('formSuccess');

  function openModal() {
    if (!modal) return;
    // هر بار که فرم باز می‌شود، فرم خالی و پیام موفقیت پنهان باشد
    if (form) { form.hidden = false; form.reset(); }
    if (success) success.hidden = true;

    modal.classList.add('is-open');
    document.body.classList.add('no-scroll');

    const firstField = modal.querySelector('input, textarea');
    if (firstField) setTimeout(function () { firstField.focus(); }, 120);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
  }

  document.querySelectorAll('[data-open-form]').forEach(function (btn) {
    btn.addEventListener('click', openModal);
  });
  document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
    btn.addEventListener('click', closeModal);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  // ارسال فرم: نمایش پیام موفقیت (بدون ارسال به سرور)
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      form.hidden = true;
      if (success) success.hidden = false;
    });
  }


  /* ==========================================================================
     ۵) انیمیشن ظاهرشدن بخش‌ها هنگام اسکرول
     ========================================================================== */
  const revealItems = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    revealItems.forEach(function (el) { observer.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  }

})();
