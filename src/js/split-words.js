/**
 * Les mots d'un titre, chacun dans son masque : `heroIn` (les divisions),
 * l'accueil et le Long métrage les font monter. Module à part (F31,
 * 18/10/2026) : l'accueil n'a plus à charger tout le socle des divisions
 * pour cette seule fonction.
 */
export function splitWords(el) {
  if (!el || el.dataset.split) return [];
  el.dataset.split = '1';
  const words = [];
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
          const mask = document.createElement('span');
          mask.className = 'dv-w';
          mask.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:0.08em;margin-bottom:-0.08em';
          const inner = document.createElement('span');
          inner.style.display = 'inline-block';
          inner.textContent = part;
          mask.append(inner);
          frag.append(mask);
          words.push(inner);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') walk(child);
    }
  };
  walk(el);
  return words;
}
