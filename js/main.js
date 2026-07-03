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
})();
