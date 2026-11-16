// Categorías, búsqueda por necesidad y datos de demostración

export const CATEGORIES = [
  { id: 'hamburgueseria', name: 'Hamburguesería', emoji: '🍔', color: '#f6c99a' },
  { id: 'veterinario', name: 'Veterinario', emoji: '🐾', color: '#b9e0cf' },
  { id: 'peluqueria', name: 'Peluquería', emoji: '💇', color: '#e7c9ef' },
  { id: 'dentista', name: 'Dentista', emoji: '🦷', color: '#c7e3f6' },
  { id: 'fisioterapia', name: 'Fisioterapia', emoji: '💆', color: '#cfe8d8' },
  { id: 'restaurante', name: 'Restaurante', emoji: '🍽️', color: '#f3d5b5' },
  { id: 'pizzeria', name: 'Pizzería', emoji: '🍕', color: '#f7cfb8' },
  { id: 'estetica', name: 'Estética', emoji: '✨', color: '#f2d4e1' },
  { id: 'taller', name: 'Taller mecánico', emoji: '🔧', color: '#d3dbe4' },
  { id: 'fontaneria', name: 'Fontanería', emoji: '🚰', color: '#c6dcf2' },
  { id: 'gimnasio', name: 'Gimnasio', emoji: '🏋️', color: '#d6d2f0' },
  { id: 'psicologia', name: 'Psicología', emoji: '🧠', color: '#e3d9f2' },
  { id: 'abogados', name: 'Abogados', emoji: '⚖️', color: '#e0dccf' },
  { id: 'optica', name: 'Óptica', emoji: '👓', color: '#cde4ea' },
  { id: 'academia', name: 'Academia', emoji: '📚', color: '#efe0bd' },
  { id: 'floristeria', name: 'Floristería', emoji: '🌷', color: '#f4d2d8' },
  { id: 'otros', name: 'Otros', emoji: '🧩', color: '#dfe3e6' },
];

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
export const QUICK_BUSINESS = ['¡Hola! ¿En qué podemos ayudarte?', 'Cita confirmada ✅', '¿Te viene bien otra hora?', 'Gracias por tu visita 😊'];

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
