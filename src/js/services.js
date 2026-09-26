/**
 * LES SERVICES — une liste qu'on déplie (26/09/2026).
 *
 * Dominique : « enlève toutes ces photos, je n'ai même pas besoin des
 * numéros ; quand on appuie dessus, on a l'explication ». Un appui ouvre un
 * service et ferme celui qui était ouvert. Le bouton porte `aria-expanded`,
 * l'explication est une région nommée par lui.
 *
 * Sans JavaScript, la classe `is-js` n'est jamais posée et tout reste ouvert.
 */

export function initServices(root = document.querySelector('[data-sv-root]')) {
  if (!root) return;
  const items = [...root.querySelectorAll('.sv__i')];
  if (!items.length) return;
  // Tout se replie d'un coup, sans la transition : sinon la page raccourcit
  // pendant une demi-seconde, après que les scènes épinglées plus bas se
  // sont mesurées — elles s'épinglaient alors en retard.
  root.classList.add('is-still', 'is-js');
  void root.offsetHeight;
  requestAnimationFrame(() => root.classList.remove('is-still'));

  const set = (li, open) => {
    li.classList.toggle('is-open', open);
    li.querySelector('.sv__q')?.setAttribute('aria-expanded', String(open));
  };

  items.forEach((li) => {
    li.querySelector('.sv__q')?.addEventListener('click', () => {
      const open = !li.classList.contains('is-open');
      items.forEach((other) => { if (other !== li) set(other, false); });
      set(li, open);
    });
  });
}
