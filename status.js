/* Finally Entitled — independent government source-status loader.
   Kept separate from app.js so a failure elsewhere cannot leave the badge stuck on its HTML placeholder. */
(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }
  function setText(el, value) { if (el) el.textContent = value; }

  function formatDate(value) {
    if (!value) return null;
    var d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function paintUnavailable(message) {
    var btn = byId('dataStatus');
    if (!btn) return;
    btn.classList.remove('good', 'checking');
    btn.classList.add('review');
    setText(btn.querySelector('strong'), 'Government source check unavailable');
    setText(byId('dataStatusDate'), message || 'Latest source status could not be loaded');
    setText(byId('statusSummary'), 'The latest automated source status could not be confirmed. Entitlement calculation rules have not been changed.');
  }

  function paint(d) {
    var btn = byId('dataStatus');
    if (!btn) return;
    var date = byId('dataStatusDate');
    var status = d && d.status ? d.status : 'unknown';
    var good = status === 'up_to_date';
    var pending = status === 'pending_first_check';
    var review = status === 'review_required';

    btn.classList.remove('good', 'review', 'checking');
    btn.classList.add(good ? 'good' : pending ? 'checking' : 'review');
    setText(btn.querySelector('strong'), good ? 'Source pages checked' : pending ? 'Government source status pending' : review ? 'Government source review needed' : 'Government source status unavailable');

    var when = formatDate(d.lastCheckAttempt) || formatDate(d.lastSuccessfulCheck);
    setText(date, when ? 'Last checked ' + when : pending ? 'Waiting for first live check' : 'Latest check needs attention');

    var sources = Array.isArray(d.sources) ? d.sources : [];
    var ok = sources.filter(function (s) { return s.status === 'up_to_date'; }).length;
    var failed = sources.filter(function (s) { return s.status === 'check_failed'; }).length;
    var waiting = sources.filter(function (s) { return s.status === 'pending'; }).length;
    setText(byId('statusSummary'), good
      ? ok + ' official source pages were checked or reviewed. This monitors pages, not every grant, opening date or entitlement rule. Core calculation rules are reviewed separately.'
      : pending
        ? 'Monitoring is installed for ' + sources.length + ' official sources. The first live baseline has not completed yet.'
        : review
          ? 'Review required: ' + failed + ' source' + (failed === 1 ? '' : 's') + ' could not be checked and ' + waiting + ' source' + (waiting === 1 ? ' is' : 's are') + ' awaiting a complete baseline. Existing calculation rules remain unchanged until reviewed.'
          : 'The latest automated source status could not be interpreted.');

    var list = byId('sourceStatusList');
    if (list) {
      list.innerHTML = sources.map(function (s) {
        var isOk = s.status === 'up_to_date';
        var isPending = s.status === 'pending';
        var checked = s.checked ? ' · page checked ' + (formatDate(s.checked + 'T00:00:00') || s.checked) : ' · awaiting live check';
        var safe = function(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
        var sourceUrl = /^https:\/\//.test(s.url||'') ? '<a target="_blank" rel="noopener" href="'+safe(s.url)+'">View source →</a>' : '';
        return '<div class="source-status-item"><span class="status-dot ' + (isOk ? '' : 'review') + '"></span><div><b>' + safe(s.label || 'Official source') + '</b><small>' + safe(s.jurisdiction || '') + safe(checked) + (isPending ? ' · baseline pending' : ' · ' + (isOk ? (s.method === 'manual_official_verification' ? 'manual page review; automated access unavailable' : 'automated page check') : 'review required')) + '</small> '+sourceUrl+'</div></div>';
      }).join('');
    }
  }

  async function load() {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 10000);
    try {
      var res = await fetch('/data-status.json?status=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var d = await res.json();
      paint(d);
    } catch (err) {
      paintUnavailable(err && err.name === 'AbortError' ? 'Status check timed out' : 'Latest source status could not be loaded');
    } finally {
      clearTimeout(timer);
    }
  }

  function wirePanel() {
    var btn = byId('dataStatus'), panel = byId('dataStatusPanel'), close = byId('closeStatusPanel');
    if (btn && panel) btn.addEventListener('click', function () { panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); });
    if (close && panel && btn) close.addEventListener('click', function () { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); });
    if (panel && close) panel.addEventListener('click', function (e) { if (e.target === panel) close.click(); });
  }

  function boot() { wirePanel(); load(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
