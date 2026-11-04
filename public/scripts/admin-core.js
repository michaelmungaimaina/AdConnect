/* AdConnect admin — session token + authenticated fetch.
   Loaded BEFORE admin.js. Every request to /api/ automatically carries the
   signed token issued by POST /api/auth. */
(function () {
  'use strict';
  var KEY = 'adc_admin_token';
  var store = {
    get: function () { try { return localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || ''; } catch (e) { return ''; } },
    set: function (t, remember) { try { (remember ? localStorage : sessionStorage).setItem(KEY, t); (remember ? sessionStorage : localStorage).removeItem(KEY); } catch (e) { /* ignore */ } },
    clear: function () { try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
  };
  window.AdminToken = store;

  var nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var isApi = /^\/api\//.test(url) || url.indexOf(location.origin + '/api/') === 0;
    if (!isApi) return nativeFetch(input, init);
    init = init || {};
    var headers = new Headers(init.headers || (typeof input !== 'string' && input.headers) || {});
    var tok = store.get();
    if (tok && !headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + tok);
    init.headers = headers;
    return nativeFetch(input, init).then(function (res) {
      if (res.status === 401 && !/\/api\/auth$/.test(url) && typeof window.__sessionExpired === 'function') window.__sessionExpired();
      return res;
    });
  };

  /** Download a file that needs the token (e.g. proposal attachments, CSV exports). */
  window.downloadAuthed = function (url, filename) {
    return fetch(url).then(function (r) {
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (d) { throw new Error(d.error || 'Download failed'); });
      return r.blob();
    }).then(function (blob) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename || 'download';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    });
  };
})();
