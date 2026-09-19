/**
 * SOURCE UNIQUE DE VÉRITÉ — contenu du site.
 * Chaque chaîne provient de ethiopianfilmoffice.com (relevé le 18/09/2026),
 * cf. content/source-verbatim.md. Seules les corrections orthographiques
 * listées au §15 du verbatim ont été appliquées.
 * RÈGLE : ne jamais ajouter ici un fait absent de la source.
 */

export const identity = {
  brand: 'Teddy Studio',
  service: 'Ethiopian Film Office',
  tagline: 'Gateway to Africa',
  founder: 'Tewodros Teshome',
  phone: '+251911204388',
  phoneDisplay: '+251 911 204 388',
  email: 'info@ethiopianfilmoffice.com',
  address: 'Addis Ababa / Ethiopia, In front of Meskel Square, Finfine Building, 5th Floor',
  addressShort: 'Meskel Square · Finfine Building, 5th Floor',
  city: 'Addis Ababa',
  hours: 'Monday – Sunday',
  hoursDetail: '24/7',
  timezone: 'Africa/Addis_Ababa',
  utcOffset: '+03:00',
  copyright: 'Copyright © 2024 Ethiopian Film Office',
  socials: [
    { label: 'X',        href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'Facebook', href: '#' },
    { label: 'YouTube',  href: '#' }
  ]
};

/** Meta description du site source — reprise mot pour mot. */
export const metaDescription =
  'Unlock the world of filmmaking with Us. Discover resources, permits, and support for your productions. Explore filming locations and incentives to elevate your cinematic vision. Your one-stop destination for seamless film production.';

export const nav = [
  { label: 'Home',        href: '/#top' },
  { label: 'Services',    href: '/#services' },
  { label: 'About Us',    href: '/#about' },
  { label: 'Locations',   href: '/locations.html' },
  { label: 'Our Clients', href: '/#clients' },
  { label: 'Resources',   href: '/#resources' },
  { label: 'Our Works',   href: '/works.html' },
  { label: 'Contact',     href: '/#contact' },
  { label: 'Vacancy',     href: '/vacancy.html' }
];

/** Chapô exact du site */
export const servicesIntro =
  'Our film office offers a comprehensive range of services designed to support and facilitate every aspect of your production. With our industry expertise and commitment to excellence, we provide the following services';

/** Les 8 services. `label` = libellé du site (faute « Shoting » corrigée). */
export const services = [
  { id: 'producing',       label: 'Producing' },
  { id: 'production-rental', label: 'Production Rental' },
  { id: 'casting',         label: 'Casting' },
  { id: 'shooting-permit', label: 'Shooting Permit', permit: true },
  { id: 'location-permit', label: 'Location Permit', permit: true },
  { id: 'transportation',  label: 'Transportation' },
  { id: 'accommodation',   label: 'Accommodation' },
  { id: 'editing',         label: 'Editing' }
];

export const about = {
  eyebrow: 'About Us',
  title: 'Ethiopian Film Office',
  body: "Ethiopian Film Office is a prominent film company founded by Tewodros Teshome, a visionary entrepreneur in the Ethiopian film industry. Established with the aim of promoting and supporting the growth of the local film sector, Ethiopian Film Office plays a vital role in facilitating film production, fostering creativity, and showcasing the rich cultural heritage of Ethiopia to a global audience. Under Tewodros Teshome's leadership, Ethiopian Film Office has become a hub for filmmakers, providing essential services such as location scouting, permitting assistance, production support, and access to local talent and resources.",
  short: 'Ethiopian Film Office is a prominent film company founded by Tewodros Teshome, a visionary entrepreneur in the Ethiopian film industry. Established with the aim of promoting and supporting the growth of the local film sector.'
};

export const whyIntro =
  "We are dedicated to providing exceptional support and resources to filmmakers, making us the ideal choice for your next production. Here's why you should choose us";

export const why = [
  { title: 'Extensive Local Knowledge',   body: "Our team possesses in-depth knowledge of our region's diverse locations, culture, and resources. We understand the unique requirements of filming in our area and can offer valuable insights and assistance to ensure a successful production." },
  { title: 'Streamlined Permitting Process', body: 'Navigating the permitting process can be complex and time-consuming. We have established strong relationships with local authorities and organizations, allowing us to streamline the permitting process for you. We handle the paperwork, communicate with the relevant authorities, and ensure all necessary permissions are obtained efficiently.' },
  { title: 'Access to Local Talent and Crew', body: 'We have an extensive network of skilled professionals in the local film industry. From talented actors and crew members to experienced technicians and production teams, we can connect you with the right people to bring your vision to life.' },
  { title: 'Production Support Services',  body: 'We offer comprehensive production support services to meet your specific needs. From equipment rentals to location scouting, from production logistics to post-production facilities, we provide a range of services that ensure a smooth and efficient production process.' }
];

export const locationsIntro =
  'We take pride in facilitating filming in a diverse range of stunning locations throughout Ethiopia.';

/**
 * Les 9 lieux du site. `label` = libellé du site (orthographes corrigées §15).
 * `note` = la seule légende présente sur le site source.
 * `photo` = photographie sous licence libre, cf. CREDITS.md — PLACEHOLDER
 * professionnel en attendant les repérages du studio.
 */
export const locations = [
  { slug: 'simien-mountains', label: 'Simien Mountains', sourceLabel: 'Semen Mountains', note: 'Discover the beauty of the natural world', alt: 4550,  altNote: 'Ras Dashen, the roof of Ethiopia', imgAlt: 'The ridge approaching Ras Dashen in the Simien Mountains, Ethiopia' },
  { slug: 'wonchi',           label: 'Wonchi',           alt: 3450,  altNote: 'crater rim', imgAlt: 'The crater lake of Wonchi seen from the rim, Ethiopia' },
  { slug: 'lalibela',         label: 'Lalibela',         alt: 2630,  altNote: 'rock-hewn churches', imgAlt: 'The rock-hewn church of Bete Giyorgis seen from above, Lalibela, Ethiopia' },
  { slug: 'addis-ababa',      label: 'Addis Ababa',      sourceLabel: 'Home', alt: 2355, altNote: 'the office — Meskel Square', imgAlt: 'The skyline of Addis Ababa, Ethiopia' },
  { slug: 'wollo',            label: 'Wollo',            sourceLabel: 'Wolo', alt: 2030, altNote: 'Lake Hayq', imgAlt: 'A papyrus tankwa boat on the shore of Lake Hayq, Wollo, Ethiopia' },
  { slug: 'fasilides',        label: 'Fasilides',        sourceLabel: 'Fasiledes', alt: 1994, altNote: 'Fasil Ghebbi, Gondar', imgAlt: 'A crenellated tower of the Fasilides castle at Fasil Ghebbi, Gondar, Ethiopia' },
  { slug: 'winding-road',     label: 'Winding Road',     alt: null,  altNote: 'highland escarpment', imgAlt: 'Giant lobelias beside a highland trail in the Simien range, Ethiopia' },
  { slug: 'erta-ale',         label: 'Erta Ale Lava Lake', sourceLabel: 'Ertale Lava Lake', alt: 613, altNote: 'permanent lava lake — a night shoot', imgAlt: 'The permanent lava lake inside the Erta Ale volcano, Ethiopia' },
  { slug: 'afar',             label: 'Afar',             alt: -125,  altNote: 'Danakil Depression, below sea level', imgAlt: 'A salt caravan crossing the Danakil salt plain in the Afar region, Ethiopia' }
];

/**
 * Amplitude du pays : 4 550 m (Ras Dashen) à −125 m (dépression du Danakil) = 4 675 m.
 * Ce sont des FAITS GÉOGRAPHIQUES publics et vérifiables (Wikipedia, Britannica,
 * PeakVisor), pas des affirmations du client — et c'est ce qui les rend publiables.
 * « Winding Road » n'est pas un lieu cartographié : aucune altitude n'est affichée.
 */
export const range = { high: 4550, low: -125, span: 4675 };



export const clientsIntro = 'Our Clients';

/** Les 7 clients, libellés du site (capitalisation corrigée pour l'ambassade). */
export const clients = [
  { label: 'BGI Ethiopia',                    logo: '/clients/bgi.png' },
  { label: 'Pepsi',                           logo: '/clients/pepsi.png' },
  { label: 'World Bank',                      logo: '/clients/world-bank.png' },
  { label: 'Ethiopian Prime Minister Office', logo: '/clients/prime-office.png' },
  { label: 'Ethiopia Defence Force',          logo: null },
  { label: 'U.S. Embassy Ethiopia',           logo: '/clients/us-embassy.png' },
  { label: 'Wosti Jnvis',                     logo: null }
];

export const resourcesIntro =
  'We are committed to providing filmmakers with a comprehensive range of resources to support their productions.';

export const resources = [
  { id: 'camera',       label: 'Camera',                 body: 'We provide advanced cameras—cinema, DSLRs, mirrorless—with high-resolution sensors, customizable settings, and cutting-edge features to meet filmmakers diverse needs.', img: '/kit/camera' },
  { id: 'lenses',       label: 'Lenses',                 body: 'Expand your creative vision with our diverse lens collection. Wide-angle to telephoto, prime to zoom, achieve desired focal length, depth, and visual quality.', img: '/kit/lense' },
  { id: 'drone',        label: 'Drone',                  body: 'Ensure precision with our versatile drones. Advanced features, stable flight, smooth gimbal control for steady aerial shots and dynamic filming possibilities', img: '/kit/drone' },
  { id: 'lighting',     label: 'Lighting Kit',           body: 'Shape and control lighting conditions with precision using our versatile lighting kits. Key lights, fill lights, backlight, and light modifiers included for scene illumination.', img: '/kit/lighting' },
  { id: 'microphones',  label: 'Microphones',            body: 'Achieve pristine audio with our pro-grade microphones. Capture focused directional sound with shotgun mics, individual subjects with lavaliers, and clear dialogue with boom mics.', img: '/kit/mic' },
  { id: 'green-screen', label: 'Green Screen/Chroma Key', body: 'Explore limitless visual potential with our green screen setup. Replace the green background with any image or video, enabling diverse visual effects and compositing techniques in post-production.', img: '/kit/green-screen' }
];

export const worksIntro = "We've Worked On";

/** Les 5 titres du site. `poster` = visuel d'origine du site (basse définition). */
export const works = [
  { slug: 'fikir-siferd',  label: 'Fikir Siferd',  sourceLabel: 'Fiker Siferd',  poster: null },
  { slug: 'sost-maezen-1', label: 'Sost Maezen 1', altTitle: 'Triangle',         poster: '/works/p-1' },
  { slug: 'sost-maezen-2', label: 'Sost Maezen 2', altTitle: 'Triangle II',      poster: '/works/p-2' },
  { slug: 'sele-enat-meder', label: 'Sele Enat Meder',                           poster: '/works/p-4' },
  { slug: 'kezkaza-welafen', label: 'Kezkaza Welafen', sourceLabel: 'Kezkaza Wolafen', poster: '/works/p-5' }
];

/** Champs du formulaire court — libellés exacts du site. */
export const contactFields = [
  { name: 'first_name', label: 'First Name',    type: 'text',  required: true,  autocomplete: 'given-name' },
  { name: 'last_name',  label: 'Last Name',     type: 'text',  required: true,  autocomplete: 'family-name' },
  { name: 'email',      label: 'Email Address', type: 'email', required: true,  autocomplete: 'email' },
  { name: 'phone',      label: 'Phone Number',  type: 'tel',   required: false, autocomplete: 'tel' },
  { name: 'message',    label: 'Your Message',  type: 'textarea', required: true }
];
export const contactSubmit = 'Send Message';

/** Page Vacancy — deux états. L'état live du site au 18/09/2026 est `empty`. */
export const vacancy = {
  state: 'empty',
  emptyLabel: 'No Vacancies Currently Available',
  archiveTitle: 'Vacancy Announcement',
  published: 'January 28, 2025',
  deadline: 'February 28, 2025',
  applyTo: 'info@ethiopianfilmoffice.com',
  applyLine: 'Send us your cover letter and resume',
  roles: [
    {
      slug: 'film-production-head',
      title: 'Film and Add Production Department Head',
      body: "The Creative and Production Department Head will lead the creative vision and oversee all production related activities. This role involves managing a team of directors, producers, writers, and designers to deliver high-quality content that aligns with Teddy Studio's objectives. The successful candidate will coordinate pre-production, production, and post-production processes to ensure timely and budget-friendly completion of projects.",
      responsibilities: [
        'Develop creative strategies and innovative content concepts.',
        'Oversee the planning, budgeting, and execution of production schedules.',
        'Lead and mentor a creative production team.',
        'Ensure quality control for all productions and content deliverables.',
        'Collaborate with other departments to meet client and project needs.'
      ],
      requirements: [
        "Bachelor's degree in Film Production, Media, or a related field.",
        'Minimum of 5 years of experience in creative content production.',
        'Strong leadership and project management skills.',
        'Expertise in storytelling, production workflows, and industry tools.',
        'Excellent communication and organizational abilities.'
      ]
    },
    { slug: 'marketing-head',      title: 'Marketing Department Head',           detailsUnavailable: true },
    { slug: 'printing-manager',    title: 'Digital Printing Production Manager', detailsUnavailable: true },
    { slug: 'printing-operators',  title: 'Digital Printing Operators',          detailsUnavailable: true }
  ]
};
