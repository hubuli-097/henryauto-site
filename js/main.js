(function () {
  const STORAGE_KEY = "henryauto_lang";
  const SUPPORTED = ["ru", "zh", "en"];

  function t(lang, key) {
    const parts = key.split(".");
    let value = window.HENRY_I18N?.[lang];
    for (const part of parts) {
      if (value == null) return key;
      value = value[part];
    }
    return value ?? key;
  }

  function detectDefaultLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("zh")) return "zh";
    if (nav.startsWith("ru")) return "ru";
    return "ru";
  }

  function applyLanguage(lang) {
    if (!SUPPORTED.includes(lang)) lang = "ru";

    const htmlLang = lang === "zh" ? "zh-CN" : lang;
    document.documentElement.lang = htmlLang;

    const title = t(lang, "meta.title");
    const desc = t(lang, "meta.description");
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", desc);

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(lang, el.dataset.i18n);
    });

    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      el.innerHTML = t(lang, el.dataset.i18nHtml);
    });

    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      el.alt = t(lang, el.dataset.i18nAlt);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(lang, el.dataset.i18nAria));
    });

    document.querySelectorAll(".lang-switch [data-lang]").forEach((btn) => {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    localStorage.setItem(STORAGE_KEY, lang);
    window.__henryLang = lang;
  }

  window.HenryI18n = { applyLanguage, t, detectDefaultLang };

  document.querySelectorAll(".lang-switch [data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => applyLanguage(btn.dataset.lang));
  });

  applyLanguage(detectDefaultLang());

  const toggle = document.querySelector(".nav-toggle");
  const mobileNav = document.querySelector(".nav-mobile");

  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      mobileNav.hidden = open;
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        mobileNav.hidden = true;
      });
    });
  }

  const navLinks = document.querySelectorAll('.nav-desktop a[href^="#"], .nav-mobile a[href^="#"]');

  if (navLinks.length) {
    const sections = [...navLinks]
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((link) => {
            const active = link.getAttribute("href") === `#${id}`;
            link.style.opacity = active ? "1" : "";
            link.style.color = active ? "var(--orange)" : "";
          });
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function initClientSliders() {
    document.querySelectorAll("[data-slider]").forEach((root) => {
      const track = root.querySelector(".client-slider-track");
      const slides = [...root.querySelectorAll(".client-slide")];
      const dotsWrap = root.querySelector(".client-slider-dots");
      const prevBtn = root.querySelector(".client-slider-prev");
      const nextBtn = root.querySelector(".client-slider-next");
      const currentEl = root.querySelector(".client-slider-current");
      const totalEl = root.querySelector(".client-slider-total");
      const intervalMs = Number(root.dataset.autoplay) || 7000;

      if (!track || slides.length === 0) return;

      let index = 0;
      let timer = null;

      if (totalEl) totalEl.textContent = String(slides.length);

      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "client-slider-dot" + (i === 0 ? " active" : "");
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Slide ${i + 1}`);
        dot.addEventListener("click", () => goTo(i, true));
        dotsWrap?.appendChild(dot);
      });

      const dots = dotsWrap ? [...dotsWrap.querySelectorAll(".client-slider-dot")] : [];

      function goTo(nextIndex, userTriggered) {
        index = (nextIndex + slides.length) % slides.length;
        track.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((dot, i) => {
          dot.classList.toggle("active", i === index);
          dot.setAttribute("aria-selected", String(i === index));
        });
        if (currentEl) currentEl.textContent = String(index + 1);
        slides.forEach((slide, i) => {
          slide.setAttribute("aria-hidden", String(i !== index));
        });
        if (userTriggered) restartAutoplay();
      }

      function next() {
        goTo(index + 1, false);
      }

      function prev() {
        goTo(index - 1, true);
      }

      function startAutoplay() {
        stopAutoplay();
        timer = window.setInterval(next, intervalMs);
      }

      function stopAutoplay() {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      }

      function restartAutoplay() {
        stopAutoplay();
        startAutoplay();
      }

      prevBtn?.addEventListener("click", prev);
      nextBtn?.addEventListener("click", () => goTo(index + 1, true));

      root.addEventListener("mouseenter", stopAutoplay);
      root.addEventListener("mouseleave", startAutoplay);
      root.addEventListener("focusin", stopAutoplay);
      root.addEventListener("focusout", startAutoplay);

      let touchStartX = 0;
      root.addEventListener(
        "touchstart",
        (e) => {
          touchStartX = e.changedTouches[0].clientX;
          stopAutoplay();
        },
        { passive: true }
      );
      root.addEventListener(
        "touchend",
        (e) => {
          const delta = e.changedTouches[0].clientX - touchStartX;
          if (Math.abs(delta) > 40) {
            if (delta < 0) goTo(index + 1, true);
            else prev();
          } else {
            startAutoplay();
          }
        },
        { passive: true }
      );

      goTo(0, false);
      startAutoplay();
    });
  }

  initClientSliders();
})();
