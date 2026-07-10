(function () {
  const SUPPORTED = ["ru", "zh", "en"];
  const PANEL_ORDER = ["home", "about", "process", "contract", "inspection", "clients", "team"];

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

    window.__henryLang = lang;
  }

  window.HenryI18n = { applyLanguage, t, detectDefaultLang };

  function setupPanelContacts() {
    const tpl = document.getElementById("contact-panel-template");
    if (!tpl) return;

    document.querySelectorAll(".panel:not(.panel--home) .panel-inner").forEach((inner) => {
      if (inner.querySelector("[data-contact-section]")) return;

      const container = inner.querySelector(":scope > .container");
      if (!container) return;

      const body = document.createElement("div");
      body.className = "panel-body";
      inner.insertBefore(body, container);
      body.appendChild(container);
      inner.appendChild(tpl.content.cloneNode(true));
    });
  }

  setupPanelContacts();

  document.querySelectorAll(".lang-switch [data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => applyLanguage(btn.dataset.lang));
  });

  applyLanguage(detectDefaultLang());

  const toggle = document.querySelector(".nav-toggle");
  const mobileNav = document.querySelector(".nav-mobile");

  function setMobileNavOpen(open) {
    if (!toggle || !mobileNav) return;
    toggle.setAttribute("aria-expanded", String(open));
    mobileNav.hidden = !open;
    document.body.classList.toggle("nav-mobile-open", open);
  }

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  if (toggle && mobileNav) {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = toggle.getAttribute("aria-expanded") === "true";
      setMobileNavOpen(!open);
    });

    mobileNav.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    document.addEventListener("click", () => {
      if (toggle.getAttribute("aria-expanded") === "true") {
        closeMobileNav();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileNav();
    });
  }

  const track = document.getElementById("panel-track");
  const panels = track ? [...track.querySelectorAll(".panel")] : [];
  const panelDots = [...document.querySelectorAll(".panel-dot")];
  const navPanelLinks = document.querySelectorAll(
    "a[data-panel], button[data-panel]:not(.panel-dot)"
  );
  let panelIndex = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  function isHomePanel() {
    return PANEL_ORDER[panelIndex] === "home";
  }

  function pageScrollTop() {
    return window.scrollY || document.documentElement.scrollTop || 0;
  }

  function scrollToContactBar() {
    const bar = isHomePanel()
      ? document.getElementById("contact-bar")
      : panels[panelIndex]?.querySelector("[data-contact-section]");
    if (!bar) return;

    bar.scrollIntoView({ behavior: "smooth", block: "start" });
    pulseContactHighlight(bar);
  }

  function highlightContactBar() {
    scrollToContactBar();
  }

  function panelIdToIndex(id) {
    const idx = PANEL_ORDER.indexOf(id);
    return idx >= 0 ? idx : 0;
  }

  function updateNavState(id) {
    navPanelLinks.forEach((el) => {
      if (!el.dataset.panel) return;
      const active = el.dataset.panel === id;
      if (el.matches(".nav-desktop a, .nav-mobile a, .logo")) {
        el.classList.toggle("active", active);
      }
    });
    panelDots.forEach((dot) => {
      const active = dot.dataset.panel === id;
      dot.classList.toggle("active", active);
      dot.setAttribute("aria-selected", String(active));
    });
  }

  function pulseContactHighlight(bar) {
    if (!bar) return;
    bar.classList.remove("contact-highlight");
    void bar.offsetWidth;
    bar.classList.add("contact-highlight");
    window.setTimeout(() => bar.classList.remove("contact-highlight"), 1800);
  }

  function goToPanel(id, options = {}) {
    if (!track || panels.length === 0) return;

    const nextIndex = panelIdToIndex(id);
    const isSamePanel = nextIndex === panelIndex;

    panelIndex = nextIndex;
    // % 相对 track 自身宽度；N 个 panel 时每屏偏移 100/N
    track.style.transform = `translateX(-${(panelIndex / panels.length) * 100}%)`;
    document.body.dataset.activePanel = id;

    panels.forEach((panel) => {
      panel.classList.toggle("panel--active", panel.dataset.panel === id);
    });

    updateNavState(id);
    closeMobileNav();

    if (!options.preserveScroll && !isSamePanel) {
      window.scrollTo(0, 0);
    }
    if (options.focusContact) {
      window.setTimeout(scrollToContactBar, 420);
    }
  }

  navPanelLinks.forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const id = el.dataset.panel;
      if (!id) return;
      goToPanel(id, { focusContact: el.hasAttribute("data-focus-contact") });
    });
  });

  panelDots.forEach((dot) => {
    dot.addEventListener("click", () => goToPanel(dot.dataset.panel));
  });

  document.querySelectorAll("[data-contact-highlight]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      highlightContactBar();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" && panelIndex > 0) {
      goToPanel(PANEL_ORDER[panelIndex - 1]);
    }
    if (e.key === "ArrowRight" && panelIndex < PANEL_ORDER.length - 1) {
      goToPanel(PANEL_ORDER[panelIndex + 1]);
    }
  });

  const viewport = document.getElementById("panel-viewport");
  if (viewport) {
    let touchAxis = null;
    let touchActive = false;

    viewport.addEventListener(
      "touchstart",
      (e) => {
        if (e.target.closest("[data-slider], .nav-mobile, .contact-modal")) {
          touchActive = false;
          return;
        }
        touchActive = true;
        touchAxis = null;
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
      },
      { passive: true }
    );

    viewport.addEventListener(
      "touchmove",
      (e) => {
        if (!touchActive || !e.touches[0]) return;
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        if (touchAxis == null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
          touchAxis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
        }
        // 明确横向滑动时阻止浏览器橡皮筋拖出空白
        if (touchAxis === "x" && e.cancelable) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    viewport.addEventListener(
      "touchend",
      (e) => {
        if (!touchActive) return;
        touchActive = false;
        if (touchAxis !== "x") return;
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(deltaX) < 56) return;
        if (deltaX < 0 && panelIndex < PANEL_ORDER.length - 1) {
          goToPanel(PANEL_ORDER[panelIndex + 1]);
        } else if (deltaX > 0 && panelIndex > 0) {
          goToPanel(PANEL_ORDER[panelIndex - 1]);
        }
      },
      { passive: true }
    );
  }

  function initClientSliders() {
    document.querySelectorAll("[data-slider]").forEach((root) => {
      const trackEl = root.querySelector(".client-slider-track");
      const slides = [...root.querySelectorAll(".client-slide")];
      const dotsWrap = root.querySelector(".client-slider-dots");
      const prevBtn = root.querySelector(".client-slider-prev");
      const nextBtn = root.querySelector(".client-slider-next");
      const currentEl = root.querySelector(".client-slider-current");
      const totalEl = root.querySelector(".client-slider-total");
      const intervalMs = Number(root.dataset.autoplay) || 7000;

      if (!trackEl || slides.length === 0) return;

      let index = 0;
      let timer = null;

      if (totalEl) totalEl.textContent = String(slides.length);

      function bindSliderControl(el, handler) {
        if (!el) return;
        el.tabIndex = -1;
        el.addEventListener("pointerdown", (e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
        });
        el.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const scrollY = window.scrollY;
          handler();
          if (document.activeElement === el) {
            el.blur();
          }
          window.scrollTo(0, scrollY);
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
          });
        });
      }

      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "client-slider-dot" + (i === 0 ? " active" : "");
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Slide ${i + 1}`);
        bindSliderControl(dot, () => goTo(i, true));
        dotsWrap?.appendChild(dot);
      });

      const dots = dotsWrap ? [...dotsWrap.querySelectorAll(".client-slider-dot")] : [];

      function goTo(nextIndex, userTriggered) {
        index = (nextIndex + slides.length) % slides.length;
        trackEl.style.transform = `translateX(-${index * 100}%)`;
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

      bindSliderControl(prevBtn, prev);
      bindSliderControl(nextBtn, () => goTo(index + 1, true));

      root.addEventListener("mouseenter", stopAutoplay);
      root.addEventListener("mouseleave", startAutoplay);
      root.addEventListener("focusin", stopAutoplay);
      root.addEventListener("focusout", startAutoplay);

      let sliderTouchStartX = 0;
      root.addEventListener(
        "touchstart",
        (e) => {
          sliderTouchStartX = e.changedTouches[0].clientX;
          stopAutoplay();
        },
        { passive: true }
      );
      root.addEventListener(
        "touchend",
        (e) => {
          const delta = e.changedTouches[0].clientX - sliderTouchStartX;
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
  initContactModal();
  goToPanel("home");

  function initContactModal() {
    const modal = document.getElementById("contact-modal");
    if (!modal) return;

    const dialog = modal.querySelector(".contact-modal-dialog");
    const memberCards = [...modal.querySelectorAll("[data-contact-member]")];
    let lastTrigger = null;

    function openContactModal(memberId, trigger) {
      memberCards.forEach((card) => {
        card.hidden = card.dataset.contactMember !== memberId;
      });
      lastTrigger = trigger ?? null;
      modal.hidden = false;
      document.body.classList.add("contact-modal-open");
      dialog?.focus();
    }

    function closeContactModal() {
      modal.hidden = true;
      document.body.classList.remove("contact-modal-open");
      lastTrigger?.focus();
      lastTrigger = null;
    }

    document.querySelectorAll("[data-contact-modal]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openContactModal(el.dataset.contactModal, el);
      });
    });

    modal.querySelectorAll("[data-contact-modal-close]").forEach((el) => {
      el.addEventListener("click", closeContactModal);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) {
        closeContactModal();
      }
    });
  }
})();
