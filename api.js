/* =========================================================
   طبقة الاتصال بين الموقع وجوجل شيت
   تُحاكي واجهة google.script.run نفسها، فتبقى صفحات التطبيق
   كما هي دون أي تعديل في منطقها.
   ========================================================= */
(function () {
  'use strict';

  var URL_ = (typeof APP_API_URL === 'string' ? APP_API_URL : '').trim();

  function ensureUrl() {
    if (!URL_ || URL_.indexOf('/exec') === -1) {
      throw new Error('لم يتم ضبط رابط التطبيق في ملف config.js');
    }
  }

  /** نداء فعلي للخادم: POST بنص عادي حتى لا يطلب المتصفح إذن CORS مسبقاً */
  function call(fn, args) {
    ensureUrl();
    return fetch(URL_, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: fn, args: args || [] }),
      redirect: 'follow'
    }).then(function (r) {
      if (!r.ok) throw new Error('تعذّر الاتصال بالخادم (' + r.status + ')');
      return r.text();
    }).then(function (t) {
      var data;
      try { data = JSON.parse(t); }
      catch (e) { throw new Error('رد غير مفهوم من الخادم. تأكد أن صلاحية الوصول للتطبيق «أي شخص».'); }
      if (data && data.error) throw new Error(data.error);
      return data ? data.result : null;
    });
  }

  /** طلب صغير عبر GET — يُستخدم لبيانات البدء فقط (أسرع وأخف) */
  function callGet(fn, args) {
    ensureUrl();
    var u = URL_ + (URL_.indexOf('?') === -1 ? '?' : '&') +
            'api=' + encodeURIComponent(fn) +
            '&args=' + encodeURIComponent(JSON.stringify(args || []));
    return fetch(u, { redirect: 'follow' })
      .then(function (r) { return r.text(); })
      .then(function (t) {
        var data = JSON.parse(t);
        if (data && data.error) throw new Error(data.error);
        return data.result;
      });
  }

  /** محاكاة google.script.run بنفس أسلوب السلسلة */
  function runner(succ, fail) {
    var api = {
      withSuccessHandler: function (f) { return runner(f, fail); },
      withFailureHandler: function (f) { return runner(succ, f); },
      withUserObject: function () { return runner(succ, fail); }
    };
    return new Proxy(api, {
      get: function (t, prop) {
        if (prop in t) return t[prop];
        if (typeof prop !== 'string') return undefined;
        return function () {
          var args = Array.prototype.slice.call(arguments);
          call(prop, args).then(function (res) {
            if (succ) succ(res);
          })['catch'](function (err) {
            if (fail) fail(err);
            else console.error('[api] ' + prop + ': ' + err.message);
          });
        };
      }
    });
  }

  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = runner(null, null);
  window.google.script.host = { close: function () {}, setHeight: function () {} };

  window.API = { call: call, callGet: callGet, url: function () { return URL_; } };
})();
