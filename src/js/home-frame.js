/**
 * L'ACCUEIL — L'APPEL FINAL, LE CADRAGE (18/10/2026).
 *
 * « Have a Project in Mind? » est cadré comme un plan : quatre équerres de
 * viseur (le vocabulaire de la caméra du site, vague 1) partent des bords de
 * la section et se referment sur le titre quand il arrive. À la souris ou au
 * clavier, elles viennent cadrer le bouton survolé, puis reviennent au
 * titre. Au doigt, une fois le titre cadré, elles glissent sur « Discuss
 * Your Project » et y restent.
 *
 * Les équerres ne bougent qu'en `transform` (GSAP) ; elles se recalent quand
 * la mise en page change. Mouvement réduit : posées sur le titre, immobiles.
 */
import gsap from 'gsap';

export function initFrame({ lite = false, still = false } = {}) {
  const sec = document.querySelector('.hm-cta');
  const box = sec?.querySelector('.hm-cta__in');
  const title = sec?.querySelector('.hm-cta__h');
  if (!sec || !box || !title || box.querySelector('.hm-vf')) return;

  const vf = document.createElement('div');
  vf.className = 'hm-vf';
  vf.setAttribute('aria-hidden', 'true');
  vf.innerHTML = '<i class="hm-vf__c hm-vf__c--tl"></i><i class="hm-vf__c hm-vf__c--tr"></i><i class="hm-vf__c hm-vf__c--bl"></i><i class="hm-vf__c hm-vf__c--br"></i>';
  box.append(vf);
  const [tl, tr, bl, br] = vf.children;
  const btns = [...sec.querySelectorAll('.hm-cta__btn, .hm-cta__ghost')];

  let target = title;
  let entered = still;

  /* Le rectangle d'un élément, dans le repère de `.hm-cta__in`, sans les
     décalages des révélations (offsetTop/Left : la mise en page seule). */
  const rectOf = (el) => {
    let x = 0, y = 0, n = el;
    while (n && n !== box) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  };
  const place = (r, pad, dur) => {
    const S = tl.offsetWidth || 22;
    const x0 = r.x - pad, y0 = r.y - pad, x1 = r.x + r.w + pad - S, y1 = r.y + r.h + pad - S;
    const set = dur ? (el, v) => gsap.to(el, { ...v, duration: dur, ease: 'expo.out', overwrite: 'auto' }) : (el, v) => gsap.set(el, v);
    set(tl, { x: x0, y: y0 });
    set(tr, { x: x1, y: y0 });
    set(bl, { x: x0, y: y1 });
    set(br, { x: x1, y: y1 });
  };
  /* Le titre a de l'air autour de lui, mais les équerres ne sortent jamais
     de la marge de la page (sur téléphone, elle ne fait que 20 px). */
  const padOf = (el) => {
    if (el !== title) return 9;
    const side = parseFloat(getComputedStyle(box).paddingLeft) || 20;
    return Math.min(Math.max(14, title.offsetHeight * 0.16), side * 0.6);
  };
  const frame = (el, dur = 0.6) => {
    target = el;
    vf.classList.toggle('is-btn', el !== title);
    place(rectOf(el), padOf(el), still ? 0 : dur);
  };

  /* Avant l'arrivée : les équerres sont aux coins de la section. */
  const wide = () => {
    const pad = Math.min(box.offsetWidth * 0.06, 48);
    return { x: -pad, y: -pad * 0.5, w: box.offsetWidth + pad * 2, h: box.offsetHeight + pad };
  };
  if (still) frame(title, 0);
  else {
    place(wide(), 0, 0);
    gsap.set(vf.children, { autoAlpha: 0 });
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      entered = true;
      gsap.to(vf.children, { autoAlpha: 1, duration: 0.5, ease: 'power1.out' });
      frame(title, 1.4);
      vf.classList.add('is-locked');
      if (lite) gsap.delayedCall(2.2, () => frame(btns[0], 0.9));
    }, { threshold: 0.45 });
    io.observe(title);
  }

  /* Le bouton survolé, ou atteint au clavier, prend le cadre. */
  btns.forEach((b) => {
    if (!lite) {
      b.addEventListener('pointerenter', () => { if (entered) frame(b, 0.45); });
      b.addEventListener('pointerleave', () => { if (entered) frame(title, 0.7); });
    }
    b.addEventListener('focus', () => { if (entered) frame(b, 0.45); });
    b.addEventListener('blur', () => { if (entered) frame(lite ? btns[0] : title, 0.6); });
  });

  /* Mise en page qui change (police, largeur) : on se recale. */
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { if (entered) place(rectOf(target), padOf(target), 0); else place(wide(), 0, 0); }).observe(box);
  }
}
