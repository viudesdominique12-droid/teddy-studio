/**
 * LES LISTES QU'ON DÉPLIE — les services (26/09/2026) et « Why Teddy
 * Studio » (27/09/2026).
 *
 * Dominique, pour les services : « enlève toutes ces photos, je n'ai même
 * pas besoin des numéros ; quand on appuie dessus, on a l'explication ». Puis
 * pour « Why us » : « comme des carrousels fermés ; on appuie sur un pour
 * l'ouvrir, et les autres sont fermés quand un est ouvert ».
 *
 * Un appui ouvre un élément et ferme celui qui était ouvert. Le bouton porte
 * `aria-expanded`, l'explication est une région nommée par lui. Sans
 * JavaScript, la classe `is-js` n'est jamais posée et tout reste ouvert.
 */

export function initAccordion(root, { item, trigger }) {
  if (!root) return;
  const items = [...root.querySelectorAll(item)];
  if (!items.length) return;
  // Tout se replie d'un coup, sans la transition : sinon la page raccourcit
  // pendant une demi-seconde, après que les scènes épinglées plus bas se
  // sont mesurées — elles s'épinglaient alors en retard.
  root.classList.add('is-still', 'is-js');
  void root.offsetHeight;
  requestAnimationFrame(() => root.classList.remove('is-still'));

  const set = (el, open) => {
    el.classList.toggle('is-open', open);
    el.querySelector(trigger)?.setAttribute('aria-expanded', String(open));
  };

  items.forEach((el) => {
    el.querySelector(trigger)?.addEventListener('click', () => {
      const open = !el.classList.contains('is-open');
      items.forEach((other) => { if (other !== el) set(other, false); });
      set(el, open);
    });
  });
}

export function initServices(root = document.querySelector('[data-sv-root]')) {
  initAccordion(root, { item: '.sv__i', trigger: '.sv__q' });
}

export function initWhy(root = document.querySelector('[data-why]')) {
  initAccordion(root, { item: '.hm-why__i', trigger: '.hm-why__q' });
}
