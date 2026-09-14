/* =========================================================
   赖帆 · 个人主页  script.js
   原生 JavaScript，无任何第三方依赖，可直接用 file:// 打开
   ========================================================= */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- 1. 主题切换（记忆到 localStorage） ---------- */
  var root = document.documentElement;
  var THEME_KEY = "laifan-theme";

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f5f7fc" : "#080c18");
  }

  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { saved = null; }
    if (saved === "light" || saved === "dark") { applyTheme(saved); return; }
    var prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    applyTheme(prefersLight ? "light" : "dark");
  })();

  var themeToggle = $("#themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  /* ---------- 2. 移动端菜单 ---------- */
  var menuToggle = $("#menuToggle");
  var nav = $("#primaryNav");

  function closeMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.remove("is-open");
    menuToggle.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      menuToggle.classList.toggle("is-open", open);
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(e.target) || menuToggle.contains(e.target)) return;
      closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- 3. 滚动进度 + 顶栏状态 + 导航高亮 ---------- */
  var header = $("#siteHeader");
  var bar = $("#scrollProgress");
  var navLinks = $$("#primaryNav a");
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
    .filter(Boolean);

  var ticking = false;
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + "%";
    if (header) header.classList.toggle("is-stuck", y > 8);

    var current = null;
    sections.forEach(function (sec) {
      if (sec.getBoundingClientRect().top <= 140) current = sec.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle("is-active", current !== null && a.getAttribute("href") === "#" + current);
    });
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(onScroll);
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- 4. 滚动入场动画 + 数字滚动 + 进度条 ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count") || "0");
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var start = null;
    var dur = 1100;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    window.requestAnimationFrame(step);
  }

  var revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        $$("[data-count]", entry.target).forEach(animateCount);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 60 + "ms";
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    $$("[data-count]").forEach(animateCount);
  }

  /* ---------- 5. 荣誉筛选 ---------- */
  var filters = $$(".filter");
  var honors = $$("#honorList .honor");
  var emptyHint = $("#honorEmpty");

  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var cat = btn.getAttribute("data-filter");
      filters.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
      var shown = 0;
      honors.forEach(function (item) {
        var match = cat === "all" || item.getAttribute("data-cat") === cat;
        item.classList.toggle("is-hidden", !match);
        if (match) shown++;
      });
      if (emptyHint) emptyHint.hidden = shown !== 0;
    });
  });

  /* ---------- 6. 打字机效果 ---------- */
  var typed = $("#typed");
  if (typed) {
    var phrases = [
      "南京大学 化学学院 · 硕士研究生",
      "本科毕业于厦门大学 化学化工学院",
      "化学工程与工艺 → 化学",
      "热界面材料 / 石墨烯复合材料",
      "紫外光催化与反应条件优化",
      "细菌表面展示 · 草甘膦检测",
      "教学质谱测化学键能",
      "学院足球队队长"
    ];
    if (reduceMotion) {
      typed.textContent = phrases[0];
    } else {
      var pi = 0, ci = 0, deleting = false;
      (function tick() {
        var word = phrases[pi];
        ci += deleting ? -1 : 1;
        typed.textContent = word.slice(0, ci);
        var delay = deleting ? 38 : 92;
        if (!deleting && ci === word.length) { deleting = true; delay = 1700; }
        else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 320; }
        window.setTimeout(tick, delay);
      })();
    }
  }

  /* ---------- 7. 复制邮箱 ---------- */
  var copyBtn = $("#copyMail");
  var mailText = $("#mailText");
  if (copyBtn && mailText) {
    copyBtn.addEventListener("click", function () {
      var text = mailText.textContent.trim();
      var done = function () {
        var old = copyBtn.textContent;
        copyBtn.textContent = "已复制 ✓";
        copyBtn.classList.add("is-done");
        window.setTimeout(function () {
          copyBtn.textContent = old;
          copyBtn.classList.remove("is-done");
        }, 1900);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
      } else {
        fallback(text, done);
      }
    });
  }

  function fallback(text, done) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      done();
    } catch (e) { /* 静默失败 */ }
  }

  /* ---------- 8. 获奖证书查看器（灯箱） ---------- */
  var lb = $("#lightbox");
  if (lb) {
    var lbImage = $("#lbImage");
    var lbTitle = $("#lbTitle");
    var lbCount = $("#lbCount");
    var lastFocus = null;
    var index = 0;

    // 所有带证书的按钮，按页面顺序编号，可左右切换
    var certBtns = $$("[data-cert]");
    var gallery = certBtns.map(function (b) {
      return { src: b.getAttribute("data-cert"), title: b.getAttribute("data-cert-title") || "" };
    });

    function show(i) {
      if (!gallery.length) return;
      index = (i + gallery.length) % gallery.length;
      var item = gallery[index];
      lbImage.setAttribute("src", item.src);
      lbImage.setAttribute("alt", item.title + " 获奖证书");
      if (lbTitle) lbTitle.textContent = item.title;
      if (lbCount) lbCount.textContent = (index + 1) + " / " + gallery.length;
      var multi = gallery.length > 1;
      var prev = $("#lbPrev"), next = $("#lbNext");
      if (prev) prev.hidden = !multi;
      if (next) next.hidden = !multi;
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.hidden = false;
      // 触发过渡
      window.requestAnimationFrame(function () { lb.classList.add("is-open"); });
      document.body.classList.add("lb-locked");
      var close = $("#lbClose");
      if (close) close.focus();
    }

    function close() {
      lb.classList.remove("is-open");
      document.body.classList.remove("lb-locked");
      window.setTimeout(function () {
        lb.hidden = true;
        lbImage.setAttribute("src", "");
      }, 240);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    certBtns.forEach(function (btn, i) {
      btn.addEventListener("click", function () { open(i); });
    });

    $$("[data-lb-close]", lb).forEach(function (el) {
      el.addEventListener("click", close);
    });
    var prevBtn = $("#lbPrev"), nextBtn = $("#lbNext");
    if (prevBtn) prevBtn.addEventListener("click", function () { show(index - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { show(index + 1); });

    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(index - 1);
      else if (e.key === "ArrowRight") show(index + 1);
    });

    // 触摸左右滑动切换
    var startX = null;
    lb.addEventListener("touchstart", function (e) {
      startX = e.touches.length === 1 ? e.touches[0].clientX : null;
    }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (startX === null || !e.changedTouches.length) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });
  }

})();