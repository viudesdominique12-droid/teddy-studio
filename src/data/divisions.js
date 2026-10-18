/**
 * LES SEPT ACTIVITÉS — source unique (brief du client, 17/10/2026).
 *
 * Le brief fait de l'entreprise une société média, événements et production,
 * en sept divisions distinctes, chacune avec sa page, son formulaire et son
 * portfolio. Live Streaming et Event Organizing sont les deux têtes
 * d'affiche (`featured`) et ne sont JAMAIS fusionnées.
 *
 * Les titres (`tagline`) et les textes d'appui (`lede`) sont ceux du brief, mot
 * pour mot. `short` est le résumé d'une ligne des cartes (accueil, Services,
 * menu). `prefix` marque l'objet de chaque demande, pour que l'équipe trie les
 * deux divisions (et les autres) sans les confondre. `accent` ne sert qu'aux
 * touches de lumière propres à chaque page (le reste suit le thème).
 */

export const divisions = [
  {
    id: 'live',
    slug: 'live-streaming',
    href: '/live-streaming.html',
    name: 'Live Streaming',
    navName: 'Live Streaming Services',
    short: 'Weddings, conferences, concerts and ceremonies, broadcast live to audiences anywhere.',
    tagline: 'Your Event. Live to the World.',
    lede: 'Professional live streaming solutions for weddings, conferences, concerts, corporate events, religious gatherings, and special occasions. We bring your event to audiences wherever they are.',
    cta: 'Book a Live Stream',
    prefix: 'LIVE',
    accent: '#ff4a3d',
    featured: true
  },
  {
    id: 'events',
    slug: 'event-organizing',
    href: '/event-organizing.html',
    name: 'Event Organizing',
    navName: 'Event Organizing',
    short: 'From intimate celebrations to conferences, concerts and cultural events, planned and run end to end.',
    tagline: 'We Bring Events to Life.',
    lede: 'From intimate celebrations to major corporate gatherings, conferences, concerts, and cultural events, we plan and coordinate experiences that bring people together.',
    cta: 'Plan Your Event',
    prefix: 'EVENT',
    accent: '#f2a93b',
    featured: true
  },
  {
    id: 'ai',
    slug: 'ai-production',
    href: '/ai-production.html',
    name: 'AI Production',
    navName: 'AI Production',
    short: 'Creative direction and human expertise, with AI-assisted tools for distinctive visual content.',
    tagline: 'Creative Vision. Powered by AI.',
    lede: 'We combine creative thinking, modern production techniques, and AI-assisted workflows to develop distinctive visual content for brands, artists, businesses, and creative projects.',
    cta: 'Start an AI Production Project',
    prefix: 'AI',
    accent: '#8f7cff'
  },
  {
    id: 'music',
    slug: 'music-production',
    href: '/music-production.html',
    name: 'Music Production',
    navName: 'Music Production',
    short: 'Recording, production, mixing and mastering for artists, brands and filmmakers.',
    tagline: 'Your Sound. Your Identity.',
    lede: 'Professional music and audio production for artists, brands, filmmakers, and creative projects, from the first idea to the final mix.',
    cta: 'Start a Music Project',
    prefix: 'MUSIC',
    accent: '#ff5c8a'
  },
  {
    id: 'film',
    slug: 'feature-film',
    href: '/feature-film.html',
    name: 'Feature Film Production',
    navName: 'Feature Film Production',
    short: 'Cinematic stories developed and produced, from the first concept to the final cut.',
    tagline: 'Stories Made for the Big Screen.',
    lede: 'From the first concept to the final cut, we develop and produce cinematic stories with a focus on compelling narratives, strong visuals, and professional execution.',
    cta: 'Discuss a Film Project',
    prefix: 'FILM',
    accent: '#e8c27a'
  },
  {
    id: 'doc',
    slug: 'documentary',
    href: '/documentary.html',
    name: 'Documentary Production',
    navName: 'Documentary Production',
    short: 'Real people, places and issues, documented with research and authentic storytelling.',
    tagline: 'Real Stories. Lasting Impact.',
    lede: 'We document people, communities, cultures, organizations, and important issues through thoughtful research, authentic storytelling, and professional film production.',
    cta: 'Commission a Documentary',
    prefix: 'DOC',
    accent: '#c98a52'
  },
  {
    id: 'rentals',
    slug: 'equipment-rentals',
    href: '/equipment-rentals.html',
    name: 'Equipment Rentals',
    navName: 'Audio/Video Equipment Rentals',
    short: 'Professional camera, audio, lighting and streaming equipment, with or without an operator.',
    tagline: 'Professional Equipment. Ready for Your Next Production.',
    lede: 'Access professional audio, video, camera, lighting, and streaming equipment for events, films, music projects, and commercial productions.',
    cta: 'Request Rental Quote',
    prefix: 'RENTAL',
    accent: '#7fb7d9'
  }
];

export const divisionById = Object.fromEntries(divisions.map((d) => [d.id, d]));
