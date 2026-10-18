/**
 * FEATURE FILM — « Where we come in » : les billets et le faisceau de
 * poursuite (19/10/2026).
 *
 * Quatre billets de cinéma. Un faisceau descend du haut de la salle
 * (`.fi-follow`, film.css) et va d'un billet à l'autre au fil du
 * défilement ; il rejoint celui qu'on survole ou qu'on atteint au clavier,
 * puis revient où en est le défilement. Le billet éclairé se soulève, sa
 * place passe à l'or.
 *
 * Le billet choisi est poinçonné : au clic (le lien oriente le formulaire,
 * `?level=`), et quand le choix « Role you want from us » change dans le
 * formulaire — le poinçon suit toujours le rôle coché.
 *
 * À l'arrivée, les billets se posent comme une main qui les distribue.
 * Sur téléphone : pas de faisceau, le billet au milieu de l'écran s'éclaire.
 * Sans mouvement : le faisceau saute sans glisser, rien n'entre.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced } from '../motion.js';

gsap.registerPlugin(ScrollTrigger);

export function initSeats() {
  const sec = document.getElementById('roles');
  const list = sec?.querySelector('[data-tix]');
  if (!list) return;
  const ticks = [...list.querySelectorAll('[data-tick]')];
  const follow = sec.querySelector('[data-follow]');
  const STILL = reduced();
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const wide = matchMedia('(min-width: 40.01rem)');
  const n = ticks.length;

  let lit = -1;
  let held = -1;      // survolé ou au clavier
  let atScroll = 0;   // où en est le défilement

  /* Le faisceau vers le billet `i` : on tourne le cône autour de son
     sommet, et on règle sa longueur. */
  const aim = (i, instant = false) => {
    if (!follow || i < 0) return;
    if (!wide.matches) { gsap.set(follow, { autoAlpha: 0 }); return; }
    const s = sec.getBoundingClientRect();
    const f = follow.getBoundingClientRect();
    const t = ticks[i].getBoundingClientRect();
    const dx = t.left + t.width / 2 - f.left;
    const dy = t.top + t.height * 0.4 - f.top;
    if (!s.width) return;
    const rot = (-Math.atan2(dx, dy) * 180) / Math.PI;
    const len = Math.hypot(dx, dy) + t.height * 0.25;
    // Le cône naît au bord haut de la section (au-dessus, il est coupé) :
    // on le fait apparaître là, en fondu, pour que la coupe ne se voie pas.
    const born = Math.max(0, (s.top - f.top) / Math.max(0.2, Math.cos(Math.atan2(dx, dy))));
    const m0 = Math.min(80, (born / len) * 100);
    gsap.to(follow, {
      rotation: rot, '--len': `${Math.round(len)}px`, '--m0': `${m0.toFixed(1)}%`,
      duration: instant || STILL ? 0 : 0.95, ease: 'power3.inOut', overwrite: 'auto'
    });
  };
  const light = (i, instant) => {
    if (i === lit) return;
    lit = i;
    ticks.forEach((t, j) => t.classList.toggle('is-lit', j === i));
    aim(i, instant);
  };

  /* Le défilement mène le faisceau. */
  ScrollTrigger.create({
    trigger: list, start: 'top 70%', end: 'bottom 42%',
    onUpdate: (self) => {
      atScroll = Math.min(n - 1, Math.floor(self.progress * n));
      if (held < 0) light(atScroll);
    }
  });
  if (follow) gsap.set(follow, { transformOrigin: '0 0' });
  light(0, true);
  ScrollTrigger.addEventListener('refresh', () => aim(lit, true));
  wide.addEventListener?.('change', () => { gsap.set(follow, { autoAlpha: 1 }); aim(lit, true); });

  /* La main et le clavier le reprennent. */
  ticks.forEach((t, i) => {
    if (FINE) t.addEventListener('pointerenter', () => { held = i; light(i); });
    t.addEventListener('focusin', () => { held = i; light(i); });
  });
  if (FINE) list.addEventListener('pointerleave', () => { held = -1; light(atScroll); });
  list.addEventListener('focusout', (e) => {
    if (list.contains(e.relatedTarget)) return;
    held = -1; light(atScroll);
  });

  /* Le poinçon : il suit le rôle choisi. */
  const levelOf = (t) => {
    const a = t.querySelector('a[href*="level="]');
    return a ? new URL(a.href, location.href).searchParams.get('level') : null;
  };
  const punch = (value) => ticks.forEach((t) => t.classList.toggle('is-punched', Boolean(value) && levelOf(t) === value));
  ticks.forEach((t) => t.querySelector('a')?.addEventListener('click', () => punch(levelOf(t))));
  const form = document.querySelector('form[data-inquiry="film"]');
  const checked = () => form?.querySelector('[name="level"]:checked')?.value || '';
  punch(checked());
  form?.addEventListener('change', (e) => { if (e.target.name === 'level') punch(checked()); });

  /* L'arrivée : les billets se posent, distribués. */
  if (STILL) return;
  const tilt = [-3, 2, -1.5, 2.5];
  gsap.set(ticks, { autoAlpha: 0, y: 46, rotation: (i) => tilt[i % tilt.length] });
  if (follow) gsap.set(follow, { autoAlpha: 0 });
  ScrollTrigger.create({
    trigger: list, start: 'top 86%',
    onEnter: (self) => {
      self.kill();
      gsap.to(ticks, {
        autoAlpha: 1, y: 0, rotation: 0, duration: 0.95, ease: 'power3.out', stagger: 0.09,
        clearProps: 'transform,opacity,visibility',
        onComplete: () => aim(lit)
      });
      if (follow && wide.matches) gsap.to(follow, { autoAlpha: 1, duration: 1.2, delay: 0.35, ease: 'power2.out' });
    }
  });
}
