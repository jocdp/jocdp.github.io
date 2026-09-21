/* =========================================================
   تهيئة الصفحة: تجهّز الإعدادات قبل تشغيل التطبيق ثم تحدّثها
   من الخادم دون أن يشعر الزائر بأي انتظار.
   ========================================================= */
(function () {
  'use strict';

  // قيم مبدئية تظهر فوراً (تُحدَّث من الخادم بعد لحظات)
  window.__CFG = {
    party: 'الحزب المدني الديمقراطي الأردني',
    phones: '',
    address: '',
    statusUrl: (location.origin + location.pathname).replace(/admin\.html$/, '') + '?page=status',
    requirePass: true,
    sigCard: 130,
    sigPrint: 120,
    sigDark: 180
  };

  var isAdmin = /admin\.html/i.test(location.pathname);

  function applyPublic() {
    var C = window.__CFG;
    try {
      if (C.party) {
        document.title = C.party + (isAdmin ? ' — لوحة إدارة العضوية' : ' — الانتساب الإلكتروني');
        var h = document.getElementById('hName');
        if (h) h.textContent = C.party;
        var ht = document.getElementById('hTitle');
        if (ht && window.innerWidth >= 700) ht.textContent = 'لوحة إدارة العضوية — ' + C.party;
      }
      if (isAdmin) {
        var pf = document.getElementById('passField');
        if (pf) pf.hidden = !C.requirePass;
      }
      // الروابط الرسمية في شاشة «عن الحزب»
      if (typeof window.applyExtLinks === 'function') window.applyExtLinks();
    } catch (e) {}
  }

  // تحديث الإعدادات العامة في الخلفية (لا يؤخّر ظهور الصفحة)
  function refreshPublic() {
    if (!window.API) return;
    window.API.callGet('getBootstrap', ['form']).then(function (res) {
      if (res && res.cfg) {
        Object.assign(window.__CFG, res.cfg);
        applyPublic();
      }
    })['catch'](function () { /* تبقى القيم المبدئية */ });
  }

  // تُستدعى من لوحة الإدارة بعد نجاح الدخول لجلب الإعدادات الكاملة
  window.__afterLogin = function (cred) {
    if (!window.API) return;
    window.API.call('getBootstrap', ['admin', cred]).then(function (res) {
      if (res && res.cfg) {
        Object.assign(window.__CFG, res.cfg);
        applyPublic();
        if (typeof window.applySigTune === 'function') { try { window.applySigTune(); } catch (e) {} }
      }
    })['catch'](function () {});
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyPublic(); refreshPublic(); });
  } else { applyPublic(); refreshPublic(); }
})();
