/**
 * LE CATALOGUE DE LOCATION — source unique (brief du client §7, 17/10/2026).
 *
 * Les six catégories du brief, dans son ordre. Chaque catégorie liste ce
 * qu'on peut y demander (`covers`, les termes du brief) ; les ARTICLES ne
 * sont que ceux que le site présentait déjà comme parc (`items`). Le brief
 * demande que l'inventaire affiché reflète le parc réel : on n'invente ni
 * marque, ni modèle, ni quantité, ni prix. Pour ajouter un appareil, on ajoute
 * un article ici (marque, modèle, photo, caractéristiques…).
 *
 * `price` : null = « Price on request » (le brief : bouton « Request Rental
 * Quote » quand les prix ne sont pas publiés). `availability` n'est jamais
 * « disponible » sans vérification : « Confirmed on request ».
 */

export const RENTAL_OPTIONS = [
  { id: 'dry',        label: 'Equipment only' },
  { id: 'operator',   label: 'Equipment with an operator' },
  { id: 'multicam',   label: 'Multi-camera production package' },
  { id: 'event-av',   label: 'Event audiovisual package' },
  { id: 'live',       label: 'Live streaming equipment package' },
  { id: 'film',       label: 'Film production equipment package' }
];

export const DURATIONS = ['Half day', 'Full day', 'Weekend', 'Weekly', 'Long term'];

export const equipment = [
  {
    id: 'camera',
    label: 'Camera Equipment',
    covers: ['Professional video cameras', 'Cinema cameras', 'Photography cameras', 'Camera lenses', 'Tripods and monopods', 'Camera support systems', 'Stabilizers and gimbals'],
    items: [
      {
        id: 'cinema-camera',
        name: 'Cinema Camera',
        tag: '12K',
        body: 'We provide advanced cameras—cinema, DSLRs, mirrorless—with high-resolution sensors, customizable settings, and cutting-edge features to meet filmmakers diverse needs.',
        img: '/kit/camera-800.webp', imgSmall: '/kit/camera-400.webp',
        model3d: '/kit3d/camera.glb'
      },
      {
        id: 'lenses',
        name: 'Lenses',
        tag: 'Cinematic',
        body: 'Expand your creative vision with our diverse lens collection. Wide-angle to telephoto, prime to zoom, achieve desired focal length, depth, and visual quality.',
        img: '/kit/lense-800.webp', imgSmall: '/kit/lense-400.webp',
        model3d: '/kit3d/lens.glb'
      },
      {
        id: 'drone',
        name: 'Drone',
        tag: 'Aerial',
        body: 'Ensure precision with our versatile drones. Advanced features, stable flight, smooth gimbal control for steady aerial shots and dynamic filming possibilities.',
        img: '/kit/drone-800.webp', imgSmall: '/kit/drone-400.webp',
        model3d: '/kit3d/drone.glb'
      }
    ]
  },
  {
    id: 'audio',
    label: 'Audio Equipment',
    covers: ['Professional microphones', 'Wireless microphone systems', 'Audio recorders', 'Audio mixers', 'Portable sound equipment', 'Speakers and related accessories'],
    items: [
      {
        id: 'microphones',
        name: 'Microphones',
        tag: 'Shotgun · Lavalier · Boom',
        body: 'Achieve pristine audio with our pro-grade microphones. Capture focused directional sound with shotgun mics, individual subjects with lavaliers, and clear dialogue with boom mics.',
        img: '/kit/mic-800.webp', imgSmall: '/kit/mic-400.webp'
      }
    ]
  },
  {
    id: 'lighting',
    label: 'Lighting Equipment',
    covers: ['Video production lights', 'LED panels', 'Studio lighting', 'Lighting stands and modifiers', 'Event lighting, where available'],
    items: [
      {
        id: 'lighting-kit',
        name: 'Lighting Kit',
        tag: 'Professional',
        body: 'Shape and control lighting conditions with precision using our versatile lighting kits. Key lights, fill lights, backlight, and light modifiers included for scene illumination.',
        img: '/kit/lighting-800.webp', imgSmall: '/kit/lighting-400.webp'
      }
    ]
  },
  {
    id: 'video',
    label: 'Video Production Equipment',
    covers: ['Video monitors', 'Video switchers', 'Recording equipment', 'Streaming equipment', 'Capture devices', 'Video transmission systems', 'Relevant cables and accessories'],
    items: [
      {
        id: 'green-screen',
        name: 'Green Screen / Chroma Key',
        tag: 'Studio',
        body: 'Explore limitless visual potential with our green screen setup. Replace the green background with any image or video, enabling diverse visual effects and compositing techniques in post-production.',
        img: '/kit/green-screen-800.webp', imgSmall: '/kit/green-screen-400.webp'
      }
    ]
  },
  {
    id: 'event',
    label: 'Event Production Equipment',
    covers: ['Projectors and screens', 'Public address systems', 'Stage lighting', 'Other available audiovisual equipment'],
    items: []
  },
  {
    id: 'support',
    label: 'Supporting Equipment',
    covers: ['Batteries and power accessories', 'Memory cards and storage solutions', 'Cables, adapters, and connectors', 'Stands and mounting accessories'],
    items: []
  }
];

/** Tous les articles, à plat, avec leur catégorie. */
export const allItems = equipment.flatMap((c) => c.items.map((i) => ({ ...i, category: c.id, categoryLabel: c.label })));
