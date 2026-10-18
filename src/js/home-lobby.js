/**
 * L'ACCUEIL — « WE'VE WORKED ON », LE MUR D'AFFICHES (18/10/2026).
 *
 * Les cinq affiches sont accrochées comme dans le hall d'une maison de
 * production : chacune a sa lampe de tableau au-dessus d'elle. Quand le mur
 * arrive, les lampes s'allument l'une après l'autre (un petit grésillement).
 * Au survol (souris), la lampe de l'affiche monte, la lumière suit le
 * pointeur sur le verre, l'affiche se penche à peine vers vous ; les autres
 * baissent. Au clavier, l'affiche prend le focus et s'ouvre avec Entrée
 * (la visionneuse, comme au clic). Au doigt, sur téléphone, les affiches
 * forment une rangée qu'on fait glisser : celle du milieu est éclairée.
 *
 * Les lampes, la lumière et le reflet sont des calques en `opacity` ;
 * l'inclinaison est un `transform`. Rien ne tourne en boucle.
 */
import gsap from 'gsap';

export function initLobby({ lite = false, still = false } = {}) {
  const wall = document.querySelector('.hm-films');
  if (!wall) return;
  const films = [...wall.querySelectorAll('.hm-film')];
  if (!films.length) return;

  films.forEach((li, k) => {
    li.style.setProperty('--k', k);
    const fig = li.querySelector('.hm-film__fig');
    if (!fig || li.querySelector('.hm-film__lamp')) return;
    const lamp = document.createElement('span');
    lamp.className = 'hm-film__lamp';
    lamp.setAttribute('aria-hidden', 'true');
    lamp.innerHTML = '<i class="hm-film__cone"></i>';
    fig.before(lamp);
    const glare = document.createElement('i');
    glare.className = 'hm-film__glare';
    glare.setAttribute('aria-hidden', 'true');
    fig.append(glare);

    /* Le clavier : l'affiche est un bouton qui ouvre la visionneuse. */
    const label = fig.dataset.viewLabel || li.querySelector('.hm-film__h')?.textContent?.trim() || '';
    fig.tabIndex = 0;
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', `View the artwork: ${label.replace(/\s+/g, ' ')}`);
    fig.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fig.click(); }
    });
    fig.addEventListener('focus', () => hot(li, true));
    fig.addEventListener('blur', () => hot(li, false));
  });

  wall.classList.add('is-lobby');

  function hot(li, on) {
    li.classList.toggle('is-hot', on);
    wall.classList.toggle('has-hot', films.some((f) => f.classList.contains('is-hot')));
  }

  /* L'allumage, une fois, quand le mur arrive. */
  if (still) wall.classList.add('is-on');
  else {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      wall.classList.add('is-on', 'is-waking');
      setTimeout(() => wall.classList.remove('is-waking'), 2400);
    }, { threshold: 0.3 });
    io.observe(wall);
  }

  /* À la souris : la lampe suit, le verre reflète, l'affiche se penche. */
  if (!lite) {
    films.forEach((li) => {
      const fig = li.querySelector('.hm-film__fig');
      if (!fig) return;
      if (!still) gsap.set(fig, { transformPerspective: 900 });
      const rx = still ? null : gsap.quickTo(fig, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      const ry = still ? null : gsap.quickTo(fig, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      let box = null;
      fig.addEventListener('pointerenter', () => {
        box = fig.getBoundingClientRect();
        hot(li, true);
        if (!still) gsap.to(fig, { y: -6, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
      });
      fig.addEventListener('pointermove', (e) => {
        if (!box) box = fig.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
        const y = Math.min(1, Math.max(0, (e.clientY - box.top) / box.height));
        fig.style.setProperty('--px', `${(x * 100).toFixed(1)}%`);
        fig.style.setProperty('--py', `${(y * 100).toFixed(1)}%`);
        if (rx) { rx((0.5 - y) * 7); ry((x - 0.5) * 9); }
      });
      fig.addEventListener('pointerleave', () => {
        box = null;
        hot(li, false);
        if (rx) { rx(0); ry(0); gsap.to(fig, { y: 0, duration: 0.7, ease: 'power3.out', overwrite: 'auto' }); }
      });
    });
  }

  /* Au doigt, sur téléphone : la rangée qu'on fait glisser éclaire l'affiche
     du milieu. Sur tablette (pas de rangée), toutes restent allumées. */
  const rail = matchMedia('(max-width: 40rem)');
  let railIO = null;
  const watchRail = () => {
    railIO?.disconnect();
    railIO = null;
    if (!lite || !rail.matches) { films.forEach((li) => li.classList.remove('is-hot')); wall.classList.remove('has-hot'); return; }
    railIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => hot(e.target, e.isIntersecting));
    }, { root: wall, rootMargin: '0px -38% 0px -38%', threshold: 0 });
    films.forEach((li) => railIO.observe(li));
  };
  watchRail();
  rail.addEventListener?.('change', watchRail);
}
