/**
 * L'horloge d'Addis-Abeba.
 * C'est la seule chose verte dès la première seconde et elle ne s'éteint jamais :
 * elle rend littéral le « Monday – Sunday, 24/7 » relevé sur le site source.
 * Heure réelle du fuseau Africa/Addis_Ababa (UTC+3), calculée chez le visiteur.
 */

const TZ = 'Africa/Addis_Ababa';

const fmt = (opts) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour12: false, ...opts });

const fHMS = fmt({ hour: '2-digit', minute: '2-digit', second: '2-digit' });
const fHM = fmt({ hour: '2-digit', minute: '2-digit' });

export function addisTime(withSeconds = true) {
  return (withSeconds ? fHMS : fHM).format(new Date());
}

/** Décalage, en heures, entre le visiteur et Addis. */
export function offsetFromAddis() {
  const now = new Date();
  const here = new Date(now.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
  const there = new Date(now.toLocaleString('en-US', { timeZone: TZ }));
  return Math.round((there - here) / 36e5);
}

/** Convertit une heure locale du visiteur (« 16:00 ») en heure d'Addis. */
export function toAddis(localHHMM) {
  const [h, m] = localHHMM.split(':').map(Number);
  if (Number.isNaN(h)) return null;
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return fHM.format(d);
}

/**
 * Branche tous les éléments d'horloge de la page.
 * Un seul intervalle partagé, aligné sur la seconde ronde — aucun timer superflu.
 */
export function startClocks() {
  // Avec les secondes : le seuil et l'ouverture — c'est là qu'on voit le temps passer.
  const nodes = [
    ...document.querySelectorAll('#boot-clock, #clock-open, [data-clock-sec]')
  ].map((el) => ({ el, sec: true }));
  // Sans les secondes : partout où l'heure est une donnée, pas un spectacle.
  const short = [
    ...document.querySelectorAll('#clock-bar, #clock-call, #clock-cs, #clock-foot, #clock-con, [data-clock]')
  ].map((el) => ({ el, sec: false }));

  const all = [...nodes, ...short].filter(({ el }) => el);
  if (!all.length) return () => {};

  const paint = () => {
    const hms = addisTime(true);
    const hm = addisTime(false);
    for (const { el, sec } of all) {
      const v = sec ? hms : hm;
      if (el.textContent !== v) el.textContent = v;
    }
  };

  paint();
  let id = 0;
  const tick = () => {
    paint();
    id = window.setTimeout(tick, 1000 - (Date.now() % 1000));
  };
  id = window.setTimeout(tick, 1000 - (Date.now() % 1000));

  // On ne fait pas tourner d'horloge dans un onglet caché.
  const onVis = () => {
    if (document.hidden) { clearTimeout(id); }
    else { paint(); id = window.setTimeout(tick, 1000 - (Date.now() % 1000)); }
  };
  document.addEventListener('visibilitychange', onVis);

  return () => { clearTimeout(id); document.removeEventListener('visibilitychange', onVis); };
}
