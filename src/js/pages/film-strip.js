/**
 * FEATURE FILM — « For everyone who brings a film to life » : la pellicule,
 * puis l'amorce avant la demande (19/10/2026).
 *
 * La pellicule : six images d'une bande de 35 mm (film.css).
 *   · Ordinateur (souris, mouvement permis) : la bande glisse de droite à
 *     gauche au fil du défilement, sans épingler la page. Au clavier, une
 *     image atteinte ramène la page là où elle passe au milieu.
 *   · Téléphone : la bande se tient debout ; l'image au milieu de l'écran
 *     s'éclaire, comme si la lampe passait à travers.
 *   · Tablette au doigt, ou sans mouvement : la bande se fait défiler à la
 *     main (native, aimantée au doigt).
 *
 * L'amorce : le disque de compte à rebours — l'aiguille balaie, 3, 2, 1,
 * puis « Action » — joué une fois quand il arrive, juste avant la demande.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced } from '../motion.js';

gsap.registerPlugin(ScrollTrigger);

export function initStrip() {
  const sec = document.getElementById('audiences');
  const strip = sec?.querySelector('[data-strip]');
  const film = strip?.querySelector('[data-strip-film]');
  if (!film) return;
  const frames = [...film.querySelectorAll('[data-frame]')];

  const mm = gsap.matchMedia();
  mm.add({
    drift: '(min-width: 40.01rem) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
    stand: '(max-width: 40rem)',
    still: '(prefers-reduced-motion: reduce)'
  }, (ctx) => {
    const { drift, stand, still } = ctx.conditions;

    /* La bande debout (téléphone) ne défile pas : pas de région à focaliser. */
    if (stand) { strip.removeAttribute('tabindex'); strip.removeAttribute('role'); strip.removeAttribute('aria-label'); }

    if (drift) {
      strip.classList.add('is-drift');
      strip.removeAttribute('tabindex');
      /* La bande part alignée sur la colonne du texte et finit au bord
         droit de l'écran (moins la marge) : sur un très grand écran, elle
         ne court pas plus loin qu'il ne faut. */
      const wrap = sec.querySelector('.dv-wrap');
      const gut = () => parseFloat(getComputedStyle(strip).paddingLeft) || 0;
      const edge = () => (wrap ? parseFloat(getComputedStyle(wrap).paddingRight) || 0 : gut());
      const view = () => strip.clientWidth - gut() - edge();
      const travel = () => Math.max(0, film.offsetWidth - view());
      /* Elle glisse pendant qu'elle est entière à l'écran : la première
         image se lit à l'arrivée, la dernière au départ. */
      const tw = gsap.fromTo(film, { x: 0 }, {
        x: () => -travel(), ease: 'none',
        scrollTrigger: { trigger: strip, start: 'center 78%', end: 'center 30%', scrub: 0.7, invalidateOnRefresh: true }
      });
      /* Au clavier : la page vient là où l'image atteinte passe au milieu. */
      const onFocus = (e) => {
        const fr = e.target.closest?.('[data-frame]');
        const st = tw.scrollTrigger;
        const T = travel();
        if (!fr || !st || !T) return;
        const x = Math.max(0, Math.min(T, fr.offsetLeft + fr.offsetWidth / 2 - view() / 2));
        const y = st.start + (x / T) * (st.end - st.start);
        if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.7 });
        else window.scrollTo({ top: y, behavior: 'smooth' });
      };
      strip.addEventListener('focusin', onFocus);
      return () => {
        strip.removeEventListener('focusin', onFocus);
        strip.classList.remove('is-drift');
        if (!stand) strip.setAttribute('tabindex', '0');
        gsap.set(film, { clearProps: 'transform' });
      };
    }

    if (stand && !still) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => e.target.classList.toggle('is-lit', e.isIntersecting));
      }, { rootMargin: '-44% 0px -44% 0px' });
      frames.forEach((f) => io.observe(f));
      return () => { io.disconnect(); frames.forEach((f) => f.classList.remove('is-lit')); };
    }
    return () => {
      strip.setAttribute('tabindex', '0');
      strip.setAttribute('role', 'region');
      strip.setAttribute('aria-label', 'Who this is for (scrolls sideways)');
    };
  });

  /* L'arrivée : la bande monte doucement de la table lumineuse. */
  if (!reduced()) {
    gsap.set(strip, { autoAlpha: 0, y: 40 });
    ScrollTrigger.create({
      trigger: strip, start: 'top 90%',
      onEnter: (self) => { self.kill(); gsap.to(strip, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }); }
    });
  }
}

export function initLeader() {
  const el = document.querySelector('[data-leader]');
  const ring = el?.querySelector('.fi-leader__ring');
  const num = el?.querySelector('[data-leader-n]');
  if (!ring || !num) return;
  const done = () => {
    el.classList.add('is-done');
    num.textContent = 'Action';
    gsap.set(ring, { '--a': '0deg' });
  };
  if (reduced()) { done(); return; }

  const STEP = 0.6;
  ScrollTrigger.create({
    trigger: el, start: 'top 84%',
    onEnter: (self) => {
      self.kill();   // une seule fois (`once` ne tue qu'à la fin de la course)
      const tl = gsap.timeline();
      [3, 2, 1].forEach((k, i) => {
        const t = i * STEP;
        tl.add(() => { num.textContent = String(k); }, t)
          .fromTo(ring, { '--a': '0deg' }, { '--a': '360deg', duration: STEP - 0.04, ease: 'none' }, t)
          .fromTo(num, { scale: 1.14, opacity: 0.55 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }, t);
      });
      tl.add(done, 3 * STEP)
        .fromTo(ring, { scale: 1.07 }, { scale: 1, duration: 0.6, ease: 'back.out(2.4)', clearProps: 'transform' }, 3 * STEP)
        .fromTo(num, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,transform' }, 3 * STEP);
    }
  });
}
