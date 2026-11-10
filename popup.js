// ---------------------------------------------------------------
// Sources : page à analyser + motif d'URL qui identifie un article.
// Pour ajouter un média, ajoutez une entrée ici ET son domaine
// dans "host_permissions" du manifest.json.
// ---------------------------------------------------------------
const SOURCES = [
  // cookies:true → envoie vos cookies Chrome (utile si Reuters vous a déjà "validé" en navigation normale)
  { id: 'reuters', name: 'Reuters',   color: '#ff8000', url: 'https://www.reuters.com/world/', cookies: true,
    include: /-\d{4}-\d{2}-\d{2}\/?$/ },
  { id: 'ap',      name: 'AP',        color: '#e4002b', url: 'https://apnews.com/',
    include: /^\/article\// },
  // afp.com ne publie pas de fil public : on utilise AFP Factuel (vérifications de l'AFP)
  { id: 'afp',     name: 'AFP Factuel', color: '#0b5fa5', url: 'https://factuel.afp.com/',
    include: /^\/.{10,}/ },
  { id: 'bbc',     name: 'BBC',       color: '#bb1919', url: 'https://www.bbc.com/news',
    include: /^\/news\/articles\// },
  { id: 'f24',     name: 'France 24', color: '#00a0e1', url: 'https://www.france24.com/fr/',
    include: /\/\d{8}-/ },
];

const TTL = 10 * 60 * 1000;   // cache : 10 minutes
const MAX_PER_SOURCE = 15;

const $ = (s) => document.querySelector(s);
const state = { items: [], errors: [], ts: 0, filter: 'all' };

// --- Analyse d'une page : on repère les liens qui ressemblent à des articles ---
function extract(html, src) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const base = new URL(src.url);
  const host = (h) => h.replace(/^www\./, '');
  const seen = new Set();
  const out = [];

  for (const a of doc.querySelectorAll('a[href]')) {
    let u;
    try { u = new URL(a.getAttribute('href'), base); } catch { continue; }
    if (host(u.hostname) !== host(base.hostname)) continue;
    if (!src.include.test(u.pathname)) continue;

    const h = a.querySelector('h1,h2,h3,h4,[data-testid="Heading"],[class*="title" i]') || a;
    const title = (h.textContent || '').replace(/\s+/g, ' ').trim();
    if (title.length < 30 || title.length > 220) continue;

    const key = u.origin + u.pathname;
    if (seen.has(key) || seen.has(title)) continue;
    seen.add(key); seen.add(title);

    out.push({ title, url: key, source: src.id });
    if (out.length >= MAX_PER_SOURCE) break;
  }
  return out;
}

async function load(src) {
  const r = await fetch(src.url, {
    credentials: src.cookies ? 'include' : 'omit',
    cache: 'no-store',
    headers: { Accept: 'text/html,application/xhtml+xml' },
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return extract(await r.text(), src);
}

// --- Récupération (avec cache) ---
async function refresh(force = false) {
  if (!force) {
    const { cache } = await chrome.storage.local.get('cache');
    if (cache && Date.now() - cache.ts < TTL) {
      Object.assign(state, cache);
      return render();
    }
  }
  $('#status').textContent = 'Chargement…';
  $('#refresh').disabled = true;

  const results = await Promise.allSettled(SOURCES.map(load));
  const lists = [];
  const errors = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value.length) lists.push(r.value);
    else errors.push(SOURCES[i].name + (r.status === 'rejected' ? ` (${r.reason.message})` : ' (aucun article détecté)'));
  });

  // Mélange les sources à tour de rôle pour un fil équilibré
  const items = [];
  for (let i = 0; i < MAX_PER_SOURCE; i++) for (const l of lists) if (l[i]) items.push(l[i]);

  Object.assign(state, { items, errors, ts: Date.now() });
  await chrome.storage.local.set({ cache: { items, errors, ts: state.ts } });
  $('#refresh').disabled = false;
  render();
}

// --- Rendu ---
function render() {
  $('#status').textContent = 'Mis à jour à ' +
    new Date(state.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const chips = $('#chips');
  chips.replaceChildren();
  [{ id: 'all', name: 'Tout' }, ...SOURCES].forEach((s) => {
    const b = document.createElement('button');
    b.className = 'chip' + (state.filter === s.id ? ' on' : '');
    b.textContent = s.name;
    b.onclick = () => { state.filter = s.id; render(); };
    chips.append(b);
  });

  const list = $('#list');
  list.replaceChildren();
  const items = state.items.filter((i) => state.filter === 'all' || i.source === state.filter);

  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Aucun article à afficher.';
    list.append(li);
  }

  for (const it of items) {
    const src = SOURCES.find((s) => s.id === it.source);
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = it.url; a.target = '_blank'; a.rel = 'noopener';

    const meta = document.createElement('div');
    meta.className = 'src';
    const dot = document.createElement('span');
    dot.className = 'dot'; dot.style.background = src.color;
    meta.append(dot, src.name);

    const t = document.createElement('div');
    t.className = 't'; t.textContent = it.title;

    a.append(meta, t);
    li.append(a);
    list.append(li);
  }

  $('#errors').textContent = state.errors.length ? 'Indisponible : ' + state.errors.join(', ') : '';
}

$('#refresh').onclick = () => refresh(true);
refresh();
