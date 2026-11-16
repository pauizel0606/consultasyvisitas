// Categorías, búsqueda por necesidad y datos de demostración

const ICONS = {
  hamburgueseria: '<path d="M4 11a8 6 0 0 1 16 0z"/><path d="M3.5 14.5h17"/><path d="M5 17.5h14v.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/>',
  veterinario: '<circle cx="6.5" cy="10" r="1.8"/><circle cx="10" cy="6" r="1.8"/><circle cx="14.5" cy="6" r="1.8"/><circle cx="18" cy="10" r="1.8"/><path d="M8 17.5c0-3 2-5.5 4.2-5.5s4.3 2.5 4.3 5.5c0 1.8-1.8 2.5-4.3 2.5S8 19.3 8 17.5z"/>',
  peluqueria: '<circle cx="6" cy="7" r="2.5"/><circle cx="6" cy="17" r="2.5"/><path d="M8 8.5 20 18M8 15.5 20 6"/>',
  dentista: '<path d="M7.5 4C5.3 4 4 5.7 4 8c0 2 1 3.5 1.4 6 .5 3 1.1 6 2.6 6s1.7-4 4-4 2.5 4 4 4 2.1-3 2.6-6C19 11.5 20 10 20 8c0-2.3-1.3-4-3.5-4-2 0-2.8 1-4.5 1s-2.5-1-4.5-1z"/>',
  fisioterapia: '<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/>',
  restaurante: '<path d="M7 3v18M4.5 3v4.5a2.5 2.5 0 0 0 5 0V3M17 21V3c-2.2 1.2-3.5 4-3.5 8h3.5"/>',
  pizzeria: '<path d="M12 21 3.5 6.5a14 14 0 0 1 17 0z"/><path d="M5.3 9.6a10 10 0 0 1 13.4 0"/><circle cx="11" cy="12" r=".9"/><circle cx="13.5" cy="15" r=".9"/>',
  estetica: '<path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z"/><path d="M18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  taller: '<path d="M15.5 3.5a5 5 0 0 0-4.8 6.6L3.5 17.3V20.5h3.2l7.2-7.2a5 5 0 0 0 6.6-4.8l-3 1.5-2.5-2.5z"/>',
  fontaneria: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
  gimnasio: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  psicologia: '<path d="M9 21v-3H6.6A1.6 1.6 0 0 1 5 16.4V14l-2-1 2-3.6A7 7 0 0 1 19 9.5c0 2.3-.8 3.8-2 5V21"/><path d="M12 7.5a1.8 1.8 0 0 1 2.5 2.5L12 12.5 9.5 10A1.8 1.8 0 0 1 12 7.5z"/>',
  abogados: '<path d="M12 4v16M8 20h8M5 7h14M5 7l-2.5 6a2.8 2.8 0 0 0 5 0zM19 7l-2.5 6a2.8 2.8 0 0 0 5 0z"/>',
  optica: '<circle cx="6.5" cy="14" r="3.5"/><circle cx="17.5" cy="14" r="3.5"/><path d="M10 13.5c1.3-.8 2.7-.8 4 0M3 14l1.6-6.5M21 14l-1.6-6.5"/>',
  academia: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
  floristeria: '<circle cx="12" cy="8.5" r="2"/><path d="M12 6.5a2.6 2.6 0 1 0-2.6 3.3M12 6.5a2.6 2.6 0 1 1 2.6 3.3M9.4 9.8a2.6 2.6 0 1 0 2.6 3.2 2.6 2.6 0 1 0 2.6-3.2M12 13v8M12 18.5c-1.4-2-3.4-2.6-5-2.6.5 2.1 2.6 3.1 5 2.6zM12 17.5c1.4-2 3.4-2.6 5-2.6-.5 2.1-2.6 3.1-5 2.6z"/>',
  otros: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
};

export const CATEGORIES = [
  { id: 'hamburgueseria', name: 'Hamburguesería', color: '#e8a76b' },
  { id: 'veterinario', name: 'Veterinario', color: '#5fae8f' },
  { id: 'peluqueria', name: 'Peluquería', color: '#b48ac8' },
  { id: 'dentista', name: 'Dentista', color: '#6ea8d6' },
  { id: 'fisioterapia', name: 'Fisioterapia', color: '#6fb39a' },
  { id: 'restaurante', name: 'Restaurante', color: '#d39a62' },
  { id: 'pizzeria', name: 'Pizzería', color: '#de8a6a' },
  { id: 'estetica', name: 'Estética', color: '#d58aa8' },
  { id: 'taller', name: 'Taller mecánico', color: '#8496aa' },
  { id: 'fontaneria', name: 'Fontanería', color: '#5f9fd6' },
  { id: 'gimnasio', name: 'Gimnasio', color: '#8a84d0' },
  { id: 'psicologia', name: 'Psicología', color: '#a08cd0' },
  { id: 'abogados', name: 'Abogados', color: '#a9997a' },
  { id: 'optica', name: 'Óptica', color: '#5fa8b5' },
  { id: 'academia', name: 'Academia', color: '#c9a55a' },
  { id: 'floristeria', name: 'Floristería', color: '#d68596' },
  { id: 'otros', name: 'Otros', color: '#8f989c' },
].map((c) => ({ ...c, icon: ICONS[c.id] }));

export const catById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

// Palabras que describen una necesidad -> categoría
const NEEDS = {
  hamburgueseria: ['hamburguesa', 'burger', 'hambre', 'cenar', 'comida rapida', 'patatas', 'smash'],
  veterinario: ['perro', 'gato', 'mascota', 'vacuna', 'veterin', 'cachorro', 'pulgas', 'conejo', 'animal', 'castrar', 'desparasit'],
  peluqueria: ['pelo', 'corte', 'cortarme', 'tinte', 'mechas', 'peinado', 'barba', 'barberia', 'flequillo', 'alisado'],
  dentista: ['muela', 'diente', 'dental', 'ortodoncia', 'brackets', 'encia', 'limpieza bucal', 'caries', 'blanqueamiento'],
  fisioterapia: ['espalda', 'contractura', 'lesion', 'rodilla', 'masaje', 'cervical', 'lumbar', 'fisio', 'esguince', 'tendinitis'],
  restaurante: ['comer', 'cena', 'reservar mesa', 'menu del dia', 'celebrar', 'aniversario', 'tapas', 'sushi'],
  pizzeria: ['pizza', 'calzone', 'italiana', 'lasana'],
  estetica: ['unas', 'manicura', 'depilacion', 'facial', 'pestanas', 'cejas', 'maquillaje', 'spa'],
  taller: ['coche', 'rueda', 'neumatico', 'itv', 'aceite', 'frenos', 'moto', 'averia', 'bateria', 'embrague'],
  fontaneria: ['grifo', 'fuga', 'tuberia', 'atasco', 'cisterna', 'agua', 'calentador', 'desatasco', 'gotea'],
  gimnasio: ['entrenar', 'gym', 'pesas', 'adelgazar', 'yoga', 'pilates', 'crossfit', 'entrenador'],
  psicologia: ['ansiedad', 'estres', 'terapia', 'psicolog', 'depresion', 'insomnio', 'pareja', 'duelo'],
  abogados: ['abogado', 'divorcio', 'herencia', 'contrato', 'despido', 'denuncia', 'multa', 'legal'],
  optica: ['gafas', 'lentillas', 'vista', 'graduar', 'miopia', 'gafas de sol'],
  academia: ['clases', 'ingles', 'matematicas', 'examen', 'selectividad', 'refuerzo', 'idiomas', 'oposiciones'],
  floristeria: ['flores', 'ramo', 'rosas', 'boda', 'regalo', 'plantas', 'corona'],
};

export const normalize = (s = '') =>
  s.toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ñ/g, 'n').trim();

export function inferCategory(q) {
  const n = normalize(q);
  if (!n) return null;
  let best = null, bestScore = 0;
  for (const [cat, words] of Object.entries(NEEDS)) {
    const score = words.reduce((acc, w) => acc + (n.includes(w) ? w.length : 0), 0);
    if (score > bestScore) { best = cat; bestScore = score; }
  }
  if (!best) {
    const c = CATEGORIES.find((c) => n.includes(normalize(c.name).slice(0, 5)));
    if (c) best = c.id;
  }
  return best;
}

export const SEARCH_EXAMPLES = [
  'Mi perro necesita una vacuna',
  'Quiero cortarme el pelo el sábado',
  'Me duele una muela',
  'Tengo una fuga en el grifo',
  'Cena con amigos esta noche',
  'Me duele la espalda',
  'Necesito pasar la ITV',
];

export const QUICK_CLIENT = ['¿Tenéis disponibilidad hoy?', '¿Cuál es el precio?', '¿Dónde estáis exactamente?', '¡Gracias!'];
export const QUICK_BUSINESS = ['¡Hola! ¿En qué podemos ayudarte?', 'Cita confirmada', '¿Te viene bien otra hora?', 'Gracias por tu visita'];

export const DEFAULT_HOURS = {
  0: [],
  1: [['09:00', '14:00'], ['16:00', '20:00']],
  2: [['09:00', '14:00'], ['16:00', '20:00']],
  3: [['09:00', '14:00'], ['16:00', '20:00']],
  4: [['09:00', '14:00'], ['16:00', '20:00']],
  5: [['09:00', '14:00'], ['16:00', '20:00']],
  6: [['10:00', '14:00']],
};

const FOOD_HOURS = {
  0: [['13:00', '16:00'], ['20:00', '23:30']],
  1: [],
  2: [['13:00', '16:00'], ['20:00', '23:30']],
  3: [['13:00', '16:00'], ['20:00', '23:30']],
  4: [['13:00', '16:00'], ['20:00', '23:30']],
  5: [['13:00', '16:00'], ['20:00', '00:00']],
  6: [['13:00', '16:30'], ['20:00', '00:00']],
};

// Empresas ficticias para probar la app (modo demo y seed.sql)
export const SEED_BUSINESSES = [
  { name: 'Brasa & Pan', category: 'hamburgueseria', city: 'Madrid', address: 'C/ del Olmo 12', description: 'Hamburguesas smash con pan de masa madre y carne madurada. Opciones veganas.', services: [{ name: 'Reserva de mesa', price: '' }, { name: 'Menú smash + bebida', price: '12,90 €' }], hours: FOOD_HOURS, slot: 30, tags: 'smash vegano terraza' },
  { name: 'Clínica Veterinaria Huellas', category: 'veterinario', city: 'Valencia', address: 'Av. del Puerto 45', description: 'Medicina preventiva, vacunas, cirugía y urgencias para perros, gatos y exóticos.', services: [{ name: 'Consulta general', price: '35 €' }, { name: 'Vacunación', price: '30 €' }, { name: 'Desparasitación', price: '20 €' }], hours: DEFAULT_HOURS, slot: 30, tags: 'urgencias exoticos vacunas' },
  { name: 'Estudio Ondas', category: 'peluqueria', city: 'Barcelona', address: 'C/ de Verdi 30', description: 'Peluquería tranquila, sin prisas. Cortes, color natural y tratamientos.', services: [{ name: 'Corte y peinado', price: '28 €' }, { name: 'Color', price: '45 €' }, { name: 'Barba', price: '12 €' }], hours: DEFAULT_HOURS, slot: 45, tags: 'barberia color natural' },
  { name: 'Sonrisa Clara Dental', category: 'dentista', city: 'Sevilla', address: 'C/ Feria 8', description: 'Odontología general, ortodoncia invisible y limpiezas. Primera visita gratuita.', services: [{ name: 'Primera visita', price: 'Gratis' }, { name: 'Limpieza', price: '50 €' }, { name: 'Blanqueamiento', price: '190 €' }], hours: DEFAULT_HOURS, slot: 30, tags: 'ortodoncia invisible' },
  { name: 'Fisio Equilibrio', category: 'fisioterapia', city: 'Madrid', address: 'Paseo de las Acacias 3', description: 'Fisioterapia deportiva, suelo pélvico y masaje terapéutico.', services: [{ name: 'Sesión de fisioterapia', price: '45 €' }, { name: 'Masaje descontracturante', price: '40 €' }], hours: DEFAULT_HOURS, slot: 60, tags: 'deportiva masaje' },
  { name: 'Casa Lumbre', category: 'restaurante', city: 'Bilbao', address: 'C/ Ercilla 21', description: 'Cocina de temporada a la brasa. Menú del día y cenas para grupos.', services: [{ name: 'Reserva de mesa', price: '' }, { name: 'Menú del día', price: '16 €' }], hours: FOOD_HOURS, slot: 30, tags: 'brasa grupos menu' },
  { name: 'Forno Bianco', category: 'pizzeria', city: 'Valencia', address: 'C/ de Cádiz 17', description: 'Pizza napolitana en horno de leña con fermentación de 48 horas.', services: [{ name: 'Reserva de mesa', price: '' }], hours: FOOD_HOURS, slot: 30, tags: 'napolitana leña' },
  { name: 'Calma Estética', category: 'estetica', city: 'Madrid', address: 'C/ Fuencarral 90', description: 'Tratamientos faciales, manicura y depilación en un espacio sereno.', services: [{ name: 'Facial hidratante', price: '55 €' }, { name: 'Manicura', price: '20 €' }], hours: DEFAULT_HOURS, slot: 45, tags: 'facial unas spa' },
  { name: 'Taller Motor Norte', category: 'taller', city: 'Bilbao', address: 'Polígono Ugaldeguren 4', description: 'Mecánica general, pre-ITV, neumáticos y diagnosis electrónica.', services: [{ name: 'Revisión pre-ITV', price: '39 €' }, { name: 'Cambio de aceite', price: 'desde 59 €' }], hours: DEFAULT_HOURS, slot: 60, tags: 'itv neumaticos' },
  { name: 'Aguaviva Fontaneros', category: 'fontaneria', city: 'Sevilla', address: 'C/ Arjona 2', description: 'Reparación de fugas, desatascos y calentadores. Servicio en el día.', services: [{ name: 'Visita y presupuesto', price: '25 €' }, { name: 'Desatasco', price: 'desde 60 €' }], hours: DEFAULT_HOURS, slot: 60, tags: 'urgencias 24h' },
  { name: 'Ritmo Gym', category: 'gimnasio', city: 'Barcelona', address: 'C/ de Sants 120', description: 'Entrenamiento personal, yoga y pilates. Primera clase de prueba gratis.', services: [{ name: 'Clase de prueba', price: 'Gratis' }, { name: 'Entrenamiento personal', price: '35 €' }], hours: DEFAULT_HOURS, slot: 60, tags: 'yoga pilates' },
  { name: 'Espacio Sereno Psicología', category: 'psicologia', city: 'Madrid', address: 'C/ Velázquez 50', description: 'Terapia individual y de pareja, presencial u online. Ansiedad y estrés.', services: [{ name: 'Primera sesión', price: '50 €' }, { name: 'Sesión online', price: '55 €' }], hours: DEFAULT_HOURS, slot: 60, tags: 'online pareja ansiedad' },
  { name: 'Bufete Ribera', category: 'abogados', city: 'Valencia', address: 'C/ Colón 60', description: 'Derecho laboral, familia y herencias. Primera consulta orientativa.', services: [{ name: 'Consulta orientativa', price: '40 €' }], hours: DEFAULT_HOURS, slot: 60, tags: 'laboral familia herencias' },
  { name: 'Óptica Mirada', category: 'optica', city: 'Sevilla', address: 'Av. de la Constitución 14', description: 'Graduación gratuita, gafas de diseño y lentillas.', services: [{ name: 'Graduación', price: 'Gratis' }, { name: 'Adaptación de lentillas', price: '30 €' }], hours: DEFAULT_HOURS, slot: 30, tags: 'graduacion lentillas' },
  { name: 'Academia Brújula', category: 'academia', city: 'Barcelona', address: 'C/ Aragó 210', description: 'Refuerzo escolar, selectividad e idiomas en grupos reducidos.', services: [{ name: 'Clase de prueba', price: 'Gratis' }, { name: 'Clase particular', price: '20 €/h' }], hours: DEFAULT_HOURS, slot: 60, tags: 'ingles selectividad' },
  { name: 'Flor de Agua', category: 'floristeria', city: 'Madrid', address: 'C/ Ibiza 33', description: 'Ramos de temporada, plantas y decoración floral para eventos.', services: [{ name: 'Encargo de ramo', price: 'desde 25 €' }, { name: 'Asesoría para boda', price: '' }], hours: DEFAULT_HOURS, slot: 30, tags: 'ramos bodas plantas' },
];
