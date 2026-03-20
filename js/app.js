/**
 * Sổ tay Tổng hợp Cuộc thi — Đại học Lạc Hồng
 * app.js v6.4 — Mobile back-cover + scroll fix
 *
 *  Desktop (double): P15 ghost trong suốt → P16 bìa sau (spread đẹp)
 *  Mobile  (single): P15 chứa bìa sau thật → 15 trang, dừng đúng
 *  Touch:  vuốt ngang → lật trang | vuốt dọc → scroll nội dung
 */

(function ($) {
  "use strict";

  /* ─── CONFIG ─────────────────────────────── */
  var CONFIG = {
    TOTAL_PAGES_DESKTOP : 50,
    TOTAL_PAGES_MOBILE  : 49,
    DISPLAY_TOTAL       : 49,
    PAGE_RATIO    : 0.707,
    MIN_MOBILE    : 768,
    DURATION      : 800,
    ELEVATION     : 50,
    TOPBAR_H      : 52,
    NAVBAR_H      : 56,
    HPAD          : 20,
    VPAD          : 12,
  };

  /* ─── STATE ──────────────────────────────── */
  var state = { page:1, isMobile:false, isTurning:false, initialized:false };

  /* ─── DOM ────────────────────────────────── */
  var $book, $fill, $num, $indicator;

  /* Tổng trang theo thiết bị */
  function totalPages() {
    return state.isMobile ? CONFIG.TOTAL_PAGES_MOBILE : CONFIG.TOTAL_PAGES_DESKTOP;
  }

  /* ══════════════════════════════════════════
     DIMENSIONS
  ══════════════════════════════════════════ */
  function calcDimensions() {
    var W = window.innerWidth;
    var H = window.innerHeight;
    state.isMobile = W < CONFIG.MIN_MOBILE;

    var availW = W - CONFIG.HPAD;
    var availH = H - CONFIG.TOPBAR_H - CONFIG.NAVBAR_H - CONFIG.VPAD;
    var pw, ph;

    if (state.isMobile) {
      ph = availH;
      pw = Math.round(ph * CONFIG.PAGE_RATIO);
      if (pw > availW) { pw = availW; ph = Math.round(pw / CONFIG.PAGE_RATIO); }
      pw = Math.max(pw, 160); ph = Math.max(ph, 240);
      return { w: pw, h: ph, pageW: pw, pageH: ph };
    }

    ph = availH;
    pw = Math.round(ph * CONFIG.PAGE_RATIO);
    if (pw * 2 > availW) {
      pw = Math.floor(availW / 2);
      ph = Math.round(pw / CONFIG.PAGE_RATIO);
    }
    ph = Math.max(ph, 260);
    pw = Math.max(pw, 160);
    return { w: pw * 2, h: ph, pageW: pw, pageH: ph };
  }

  /* ══════════════════════════════════════════
     TYPOGRAPHY SCALE
  ══════════════════════════════════════════ */
  function updateTypo(pageW, pageH) {
    var s = Math.max(0.68, Math.min(pageW / 215, 1.55));
    var r = document.documentElement;
    r.style.setProperty('--fs-xs',    (7.5  * s).toFixed(2) + 'px');
    r.style.setProperty('--fs-sm',    (9    * s).toFixed(2) + 'px');
    r.style.setProperty('--fs-base',  (10.5 * s).toFixed(2) + 'px');
    r.style.setProperty('--fs-md',    (12   * s).toFixed(2) + 'px');
    r.style.setProperty('--fs-lg',    (15   * s).toFixed(2) + 'px');
    r.style.setProperty('--fs-xl',    (20   * s).toFixed(2) + 'px');
    r.style.setProperty('--fs-2xl',   (26   * s).toFixed(2) + 'px');
    r.style.setProperty('--fs-3xl',   (36   * s).toFixed(2) + 'px');
    r.style.setProperty('--fs-hero',  (52   * s).toFixed(2) + 'px');
    r.style.setProperty('--fs-disp',  (56   * s).toFixed(2) + 'px');
    r.style.setProperty('--gal-main',  Math.round(pageH * 0.13)  + 'px');
    r.style.setProperty('--gal-sm',    Math.round(pageH * 0.09)  + 'px');
    r.style.setProperty('--gal-photo', Math.round(pageH * 0.115) + 'px');
    r.style.setProperty('--pg-pad',    Math.round(pageW * 0.076) + 'px');
  }

  /* ══════════════════════════════════════════
     Spread class
  ══════════════════════════════════════════ */
  function updateSpreadClass(page) {
    $book.toggleClass('at-first-spread', page === 1);
    $book.toggleClass('at-last-spread',  page >= CONFIG.DISPLAY_TOTAL);
  }

  /* ══════════════════════════════════════════
     INIT
  ══════════════════════════════════════════ */
  function init() {
    $book      = $('#flipbook');
    $fill      = $('#nav-progress-fill');
    $num       = $('#nav-page-num');
    $indicator = $('#page-indicator');
    if (!$book.length) return;

    var d = calcDimensions();
    updateTypo(d.pageW, d.pageH);

    $book.turn({
      width       : d.w,
      height      : d.h,
      autoCenter  : true,
      display     : state.isMobile ? 'single' : 'double',
      pages       : totalPages(),
      acceleration: true,
      gradients   : true,
      elevation   : CONFIG.ELEVATION,
      duration    : CONFIG.DURATION,
      when: {
        turning: function (e, page) {
          state.isTurning = true;
          $('body').addClass('is-turning');
          updateSpreadClass(page);
        },
        turned: function (e, page) {
          state.isTurning = false;
          state.page      = page;
          $('body').removeClass('is-turning');
          updateSpreadClass(page);
          updateUI(page);
        },
      }
    });

    $book.find('.page').css({ width: d.pageW, height: d.pageH });
    $book.css('background', 'transparent');

    /* Desktop: ẩn nội dung pg-back-mobile (dùng như ghost) */
    if (!state.isMobile) {
      $book.find('.pg-back-mobile').css({
        background   : 'transparent',
        pointerEvents: 'none',
        boxShadow    : 'none'
      });
    }

    state.initialized = true;
    updateSpreadClass(1);
    updateUI(1);
    bindEvents();
  }

  /* ══════════════════════════════════════════
     UI UPDATE
  ══════════════════════════════════════════ */
  function updateUI(page) {
    var dp  = Math.min(page, CONFIG.DISPLAY_TOTAL);
    var dt  = CONFIG.DISPLAY_TOTAL;
    var pct = (((dp - 1) / (dt - 1)) * 100).toFixed(1) + '%';
    $fill.css('width', pct);
    $num.text(dp + ' / ' + dt);
    $indicator.text(dp + ' / ' + dt);
    var last = totalPages();
    $('#btn-prev').toggleClass('disabled', page <= 1).prop('disabled', page <= 1);
    $('#btn-next').toggleClass('disabled', page >= last).prop('disabled', page >= last);
  }

  /* ══════════════════════════════════════════
     NAVIGATION
  ══════════════════════════════════════════ */
  function goNext() {
    if (!state.isTurning && state.page < totalPages())
      $book.turn('next');
  }
  function goPrev() {
    if (!state.isTurning && state.page > 1)
      $book.turn('previous');
  }
  function goToPage(n) {
    n = parseInt(n, 10);
    if (n >= 1 && n <= CONFIG.DISPLAY_TOTAL)
      $book.turn('page', n);
  }

  /* ══════════════════════════════════════════
     RESIZE
  ══════════════════════════════════════════ */
  function onResize() {
    if (!state.initialized) return;
    var d       = calcDimensions();
    var newMode = state.isMobile ? 'single' : 'double';
    if ($book.turn('display') !== newMode) $book.turn('display', newMode);
    $book.turn('size', d.w, d.h);
    $book.find('.page').css({ width: d.pageW, height: d.pageH });
    updateTypo(d.pageW, d.pageH);
  }

  /* ══════════════════════════════════════════
     FULLSCREEN
  ══════════════════════════════════════════ */
  function toggleFS() {
    var el = document.documentElement;
    if (!document.fullscreenElement)
      (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    else
      (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
  }

  /* ══════════════════════════════════════════
     EVENTS
  ══════════════════════════════════════════ */
  function bindEvents() {
    $('#btn-next').on('click', goNext);
    $('#btn-prev').on('click', goPrev);
    $('#btn-fullscreen').on('click', toggleFS);

    $(document).on('keydown', function (e) {
      var m = {
        ArrowRight: goNext, ArrowDown: goNext, PageDown: goNext,
        ArrowLeft:  goPrev, ArrowUp:   goPrev, PageUp:   goPrev,
        Home: function () { goToPage(1); },
        End:  function () { $book.turn('page', totalPages()); },
        f: toggleFS, F: toggleFS,
      };
      if (m[e.key]) { e.preventDefault(); m[e.key](); }
    });

    $(document).on('click', '[data-goto-page]', function () {
      goToPage($(this).data('goto-page'));
    });

    $('#nav-progress-wrap').on('click', function (e) {
      var pg = Math.max(1, Math.min(
        CONFIG.DISPLAY_TOTAL,
        Math.round((e.offsetX / $(this).width()) * (CONFIG.DISPLAY_TOTAL - 1)) + 1
      ));
      goToPage(pg);
    });

    var timer;
    $(window).on('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(onResize, 200);
    });

    /* ── Touch: vuốt ngang lật trang, vuốt dọc scroll nội dung ── */
    var sx = 0, sy = 0;
    var flipEl = document.getElementById('flipbook');

    flipEl.addEventListener('touchstart', function (e) {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }, { passive: true });

    flipEl.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      /* Chỉ lật trang khi swipe ngang rõ ràng: |dx| > 60 VÀ |dx| > |dy| * 1.5 */
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        dx < 0 ? goNext() : goPrev();
      }
      /* Nếu vuốt dọc (|dy| lớn hơn) → browser tự scroll, không làm gì */
    }, { passive: true });
  }

  /* ══════════════════════════════════════════
     PRELOADER
  ══════════════════════════════════════════ */
  function hidePreloader() {
    setTimeout(function () {
      $('#preloader').addClass('fade-out');
      setTimeout(function () { $('#preloader').remove(); }, 700);
    }, 1400);
  }

  /* ══════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════ */
  $(document).ready(function () {
    var tries = 0;
    var poll  = setInterval(function () {
      var ok = $('#stage').width() > 0 &&
               (window.innerWidth < CONFIG.MIN_MOBILE || $('#stage').height() > 0);
      if (ok || ++tries > 200) {
        clearInterval(poll);
        init();
        hidePreloader();
      }
    }, 16);
  });

})(jQuery);
