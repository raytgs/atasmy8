(function () {
  "use strict";

  var IMG = (function () {
    var sheet = document.querySelector('link[rel="stylesheet"][href*="style.css"]');
    if (sheet) {
      var href = sheet.getAttribute("href") || "";
      var cssPath = "css/style.css";
      var cssIndex = href.indexOf(cssPath);
      if (cssIndex !== -1) {
        return href.substring(0, cssIndex) + "images";
      }
    }
    return "/images";
  })();

  /* Current date/time */
  function updateClock() {
    var el = document.getElementById("currentTime");
    if (!el) return;
    var now = new Date();
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var pad = function (n) { return String(n).padStart(2, "0"); };
    el.textContent =
      now.getFullYear() + "/" + pad(now.getMonth() + 1) + "/" + pad(now.getDate()) + " " +
      pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds()) + " " +
      days[now.getDay()];
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* Language switcher — first option is current page (no href); others use data-href */
  var langSelect = document.getElementById("langSelect");
  var langFlag = document.getElementById("langFlag");

  function updateLangFlag() {
    if (!langFlag || !langSelect) return;
    var selected = langSelect.options[langSelect.selectedIndex];
    var icon = selected && selected.getAttribute("data-icon");
    if (icon) langFlag.src = icon;
  }

  function syncLangSelect() {
    if (!langSelect || !langSelect.options.length) return;

    var currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
    var matched = false;

    Array.prototype.forEach.call(langSelect.options, function (option, index) {
      if (index === 0) return;

      var href = option.getAttribute("data-href");
      if (!href) return;

      try {
        var optionPath = new URL(href, window.location.origin).pathname.replace(/\/+$/, "") || "/";
        if (
          currentPath === optionPath ||
          (optionPath !== "/" && currentPath.indexOf(optionPath + "/") === 0)
        ) {
          langSelect.value = option.value;
          matched = true;
        }
      } catch (err) {
        /* ignore invalid URLs during local preview */
      }
    });

    if (!matched) {
      langSelect.selectedIndex = 0;
    }

    updateLangFlag();
  }

  if (langSelect) {
    syncLangSelect();
    window.addEventListener("pageshow", syncLangSelect);
    window.addEventListener("popstate", syncLangSelect);

    langSelect.addEventListener("change", function () {
      var selected = langSelect.options[langSelect.selectedIndex];
      var href = selected.getAttribute("data-href");

      updateLangFlag();

      if (!href) {
        syncLangSelect();
        return;
      }

      window.location.href = href;
    });
  }

  /* Mobile menu */
  var menuToggle = document.getElementById("menuToggle");
  var mobileNavClose = document.getElementById("mobileNavClose");
  var navBackdrop = document.getElementById("navBackdrop");
  var mainNav = document.getElementById("mainNav");
  var siteHeader = document.querySelector(".site-header");
  var navDropdownItems = document.querySelectorAll(".nav-item-dropdown");

  function getDropdownTrigger(item) {
    return item.querySelector(".nav-dropdown-toggle");
  }

  function closeNavDropdowns() {
    navDropdownItems.forEach(function (item) {
      item.classList.remove("open");
      var trigger = getDropdownTrigger(item);
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  }

  /* Backdrop + nav outside sticky header — overlay must sit above top bar / APK / header */
  var mainNavAnchor = { parent: null, next: null };

  if (mainNav) {
    mainNavAnchor.parent = mainNav.parentNode;
    mainNavAnchor.next = mainNav.nextSibling;
  }

  if (navBackdrop && navBackdrop.parentNode !== document.body) {
    document.body.appendChild(navBackdrop);
  }

  function isMobileNav() {
    return window.innerWidth <= 768;
  }

  function parkMobileNavLayers() {
    if (!isMobileNav()) return;
    if (mainNav && mainNav.parentNode !== document.body) {
      document.body.appendChild(mainNav);
    }
  }

  function restoreMobileNavLayers() {
    if (!mainNav || !mainNavAnchor.parent || mainNav.parentNode !== document.body) return;
    if (mainNavAnchor.next) {
      mainNavAnchor.parent.insertBefore(mainNav, mainNavAnchor.next);
    } else {
      mainNavAnchor.parent.appendChild(mainNav);
    }
  }

  function preventBackgroundScroll(e) {
    if (!mainNav || !mainNav.classList.contains("open")) return;
    if (mainNav.contains(e.target)) return;
    e.preventDefault();
  }

  function lockPageScroll() {
    document.documentElement.classList.add("nav-open");
    document.body.classList.add("nav-open");
    document.addEventListener("touchmove", preventBackgroundScroll, { passive: false });
  }

  function unlockPageScroll() {
    document.documentElement.classList.remove("nav-open");
    document.body.classList.remove("nav-open");
    document.removeEventListener("touchmove", preventBackgroundScroll, { passive: false });
  }

  function closeMobileMenu() {
    if (!mainNav || !mainNav.classList.contains("open")) return;
    mainNav.classList.remove("open");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
    if (navBackdrop) {
      navBackdrop.classList.remove("show");
      navBackdrop.hidden = true;
    }
    restoreMobileNavLayers();
    unlockPageScroll();
    closeNavDropdowns();
  }

  function openMobileMenu() {
    if (!mainNav || mainNav.classList.contains("open")) return;
    parkMobileNavLayers();
    lockPageScroll();
    mainNav.classList.add("open");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
    if (navBackdrop) {
      navBackdrop.hidden = false;
      navBackdrop.classList.add("show");
    }
  }

  navDropdownItems.forEach(function (item) {
    var trigger = getDropdownTrigger(item);
    if (!trigger) return;

    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      var isOpen = item.classList.contains("open");

      navDropdownItems.forEach(function (other) {
        if (other !== item) {
          other.classList.remove("open");
          var otherTrigger = getDropdownTrigger(other);
          if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
        }
      });

      item.classList.toggle("open", !isOpen);
      trigger.setAttribute("aria-expanded", !isOpen ? "true" : "false");
    });
  });

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (mainNav.classList.contains("open")) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    if (mobileNavClose) {
      mobileNavClose.addEventListener("click", function (e) {
        e.stopPropagation();
        closeMobileMenu();
      });
    }

    if (navBackdrop) {
      navBackdrop.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeMobileMenu();
      });
    }

    mainNav.querySelectorAll(".nav-link:not(.nav-link-label), .nav-dropdown-link, .mobile-nav-actions .btn, .mobile-nav-logo").forEach(function (link) {
      link.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("click", function (e) {
      if (window.innerWidth > 768) {
        if (siteHeader && !siteHeader.contains(e.target)) {
          closeNavDropdowns();
        }
        return;
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 768) {
        closeMobileMenu();
      } else {
        closeNavDropdowns();
      }
    });
  }

  /* APK banner dismiss (hidden until next refresh) */
  var apkClose = document.getElementById("apkClose");
  var apkBanner = document.getElementById("apkBanner");
  var apkDismissed = false;

  function updateApkBanner() {
    if (!apkBanner) return;
    if (apkDismissed) {
      apkBanner.classList.remove("show-mobile");
      return;
    }
    if (window.innerWidth <= 768) {
      apkBanner.classList.add("show-mobile");
    } else {
      apkBanner.classList.remove("show-mobile");
    }
  }

  if (apkClose && apkBanner) {
    apkClose.addEventListener("click", function () {
      apkDismissed = true;
      apkBanner.classList.remove("show-mobile");
    });
  }

  updateApkBanner();
  window.addEventListener("resize", updateApkBanner);

  /* Hero slider */
  var track = document.getElementById("heroTrack");
  var dots = document.querySelectorAll(".hero-dot");
  if (track && dots.length) {
    var current = 0;
    var total = dots.length;

    function goTo(index) {
      current = (index + total) % total;
      track.style.transform = "translateX(-" + current * 100 + "%)";
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === current);
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { goTo(i); });
    });

    setInterval(function () { goTo(current + 1); }, 4000);
  }

  /* Game category tabs + Hall of Fame grids (English homepage only; zh/ms use inline script) */
  var pagePath = window.location.pathname.replace(/\\/g, "/");
  var pageLang = document.documentElement.getAttribute("lang") || "";
  var skipHof =
    pageLang === "zh-MY" ||
    pageLang === "ms-MY" ||
    /^\/(zh|ms)(\/|$)/.test(pagePath) ||
    /\/(zh|ms)\//.test(pagePath);
  if (!skipHof) {
  var gameTabBtns = document.querySelectorAll(".game-tab-btn");
  var gameTabPanels = document.querySelectorAll(".game-tab-panel");

  function activateGameTab(btn) {
    var target = btn.getAttribute("data-tab");
    gameTabBtns.forEach(function (b) {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    gameTabPanels.forEach(function (p) {
      p.classList.remove("active");
      p.setAttribute("hidden", "");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    var panel = document.getElementById("tab-" + target);
    if (panel) {
      panel.classList.add("active");
      panel.removeAttribute("hidden");
    }
    if (window.matchMedia("(max-width: 768px)").matches) {
      btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }

  gameTabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      activateGameTab(btn);
    });
  });

  /* Render game grids from data */
  var categoryDefaultImg = {
    live: IMG + "/games-logo/evolution.png",
    slots: IMG + "/games-logo/askmeslot.png",
    sports: IMG + "/games-logo/maxbet.png",
    lottery: IMG + "/games-logo/4dresults.png"
  };

  var games = {
    live: [
      { name: "Evolution", url: "/atas-evolution/", img: IMG + "/games-logo/evolution.png", logo: true },
      { name: "Sexy", url: "/atas-sexy/", img: IMG + "/games-logo/sexy.png", logo: true },
      { name: "Hotroad", url: "/atas-hotroad/", img: IMG + "/games-logo/hotroad.png", logo: true },
      { name: "Ezugi", url: "/atas-ezugi/", img: IMG + "/games-logo/ezugi.png", logo: true },
      { name: "DB Casino", url: "/atas-db-casino/", img: IMG + "/games-logo/dbcasino.png", logo: true },
      { name: "Playtech", url: "/atas-playtech/", img: IMG + "/games-logo/playtech.png", logo: true },
      { name: "Playace", url: "/atas-playace/", img: IMG + "/games-logo/playace.png", logo: true },
      { name: "Big Gaming", url: "/atas-big-gaming/", img: IMG + "/games-logo/biggaming.png", logo: true }
    ],
    slots: [
      { name: "AskMeSlot", url: "/atas-askmeslot/", img: IMG + "/games-logo/askmeslot.png", logo: true },
      { name: "Lucky365", url: "/atas-lucky365/", img: IMG + "/games-logo/lucky365.png", logo: true },
      { name: "Pragmatic Play", url: "/atas-pragmatic-play/", img: IMG + "/games-logo/pragmatic-play.png", logo: true },
      { name: "Microslot", url: "/atas-microslot/", img: IMG + "/games-logo/microslot.png", logo: true },
      { name: "Monkey King Slot", url: "/atas-monkey-king-slot/", img: IMG + "/games-logo/monkey-king-slot.png", logo: true },
      { name: "Jili", url: "/atas-jili/", img: IMG + "/games-logo/jili.png", logo: true },
      { name: "JDB", url: "/atas-jdb/", img: IMG + "/games-logo/jdb.png", logo: true },
      { name: "Kingmidas", url: "/atas-kingmidas/", img: IMG + "/games-logo/kingmidas.png", logo: true }
    ],
    sports: [
      { name: "Maxbet", url: "/atas-maxbet/", img: IMG + "/games-logo/maxbet.png", logo: true },
      { name: "9Wickets", url: "/atas-9wickets/", img: IMG + "/games-logo/9wickets.png", logo: true }
    ],
    lottery: [
      { name: "4D Results", url: "/atas-4d/", img: IMG + "/games-logo/4dresults.png", logo: true }
    ]
  };

  function normalizeCategoryList(filter) {
    var list = games[filter];
    if (!list || !list.length) return [];

    var defaultImg = categoryDefaultImg[filter];
    return list.map(function (game) {
      return {
        name: game.name,
        url: game.url,
        img: game.img || defaultImg,
        logo: !!game.logo
      };
    });
  }

  function resolveGameList(filter) {
    if (filter === "all") {
      var combined = normalizeCategoryList("slots")
        .concat(normalizeCategoryList("live"))
        .concat(normalizeCategoryList("sports"))
        .concat(normalizeCategoryList("lottery"));

      var seen = {};
      return combined.filter(function (game) {
        if (seen[game.name]) return false;
        seen[game.name] = true;
        return true;
      });
    }

    return normalizeCategoryList(filter);
  }

  function renderGameCard(game) {
    var cardExtraClass = game.logo ? " game-card--logo" : "";
    var inner =
      '<div class="game-card-image">' +
        '<img src="' + game.img + '" alt="' + game.name + ' game on ATAS Casino" loading="lazy" decoding="async">' +
        '<span class="game-card-overlay" aria-hidden="true"><span class="game-card-play">Play</span></span>' +
      '</div>' +
      '<p class="game-card-name">' + game.name + '</p>';

    if (game.url) {
      return '<a class="game-card' + cardExtraClass + '" href="' + game.url + '">' + inner + '</a>';
    }

    return '<article class="game-card' + cardExtraClass + '">' + inner + '</article>';
  }

  function renderGameGrid(containerId, filter) {
    var container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = resolveGameList(filter).map(renderGameCard).join("");
  }

  renderGameGrid("gameGridAll", "all");
  renderGameGrid("gameGridLive", "live");
  renderGameGrid("gameGridSlots", "slots");
  renderGameGrid("gameGridSports", "sports");
  renderGameGrid("gameGridLottery", "lottery");
  }

  /* FAQ accordion */
  document.querySelectorAll(".faq-question").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach(function (i) { i.classList.remove("open"); });
      if (!isOpen) item.classList.add("open");
    });
  });

})();
