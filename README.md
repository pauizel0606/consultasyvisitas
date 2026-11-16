# Consultas & Visitas 🌿

Aplicación web para **encontrar negocios, chatear con ellos y agendar visitas**. Diseño sereno inspirado en Apple, con efecto *liquid glass*, iconos de línea propios (sin emojis), modo claro/oscuro automático y animaciones suaves.

## Qué incluye

- **Tres tipos de cuenta**: cliente, empresa (con selector “Soy cliente / Soy empresa” al entrar y registrarse) y **administrador**.
- **Inicio distinto según quién entra**:
  - *Visitante*: presentación de la plataforma, ventajas, cómo funciona y preguntas frecuentes.
  - *Cliente*: próxima cita, mensajes recientes, accesos rápidos, visitas pendientes de valorar y favoritos.
  - *Empresa* → **Resumen**: chats por responder (con el tiempo de espera), visitas de hoy en línea temporal, citas por confirmar, citas de los próximos 7 días, últimas reseñas y lo que falta por completar del perfil.
  - *Administrador* → **Panel de control**: estadísticas y gestión de empresas y cuentas, con permiso para eliminarlas.
- **Explorar en su propia pestaña**: buscador y categorías.
- **Inicio de sesión con email o teléfono.**
- **Chat por teléfono o email**: pulsa *Nuevo* en Mensajes, escribe el teléfono o email de la empresa (o del cliente, si eres empresa) y se abre la conversación. También hay botones directos de *Llamar*, *WhatsApp* y *Email*.
- **Chats guardados en la cuenta**: al volver a entrar, o desde otro dispositivo con la misma cuenta, ves el mismo historial (con Supabase activado, ver abajo). Mensajes en tiempo real y aviso de no leídos.
- **Agenda de visitas**: el cliente elige día y hora libre según el horario de la empresa; la empresa confirma o rechaza desde el chat o desde la Agenda, y el cliente recibe el aviso en el chat.
- **Categorías**: hamburguesería, veterinario, peluquería, dentista, fisioterapia, restaurante, pizzería, estética, taller, fontanería, gimnasio, psicología, abogados, óptica, academia, floristería…
- **Buscador por necesidad**: escribe “mi perro necesita una vacuna” o “tengo una fuga en el grifo” y detecta que buscas un veterinario o un fontanero. Filtros por ciudad, abiertos ahora y valoración.
- **Panel de empresa**: datos, servicios con precio, horario por días (jornada partida), duración de cita, respuesta automática y estadísticas.

### Extras que he añadido para mejorar la idea

1. **Búsqueda inteligente por necesidad** (no hace falta saber la categoría).
2. **Reservas con huecos reales**: solo se muestran horas libres y no se pueden duplicar.
3. **Respuesta automática** configurable para el primer mensaje de cada cliente.
4. **Reseñas con estrellas** y valoración media en cada negocio.
5. **Favoritos** para clientes.
6. **Añadir la cita al calendario** (archivo .ics compatible con Apple Calendar, Google Calendar y Outlook) con recordatorio 1 h antes.
7. **Respuestas rápidas** en el chat y estado “Abierto / Cerrado” en tiempo real.

## Datos

La plataforma empieza **vacía**: sin empresas ni usuarios de prueba. Solo existe la cuenta de administrador.

## Base de datos online (Supabase, plan gratuito)

1. Crea una cuenta y un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
3. En **Authentication → Sign In / Providers → Email**, desactiva *Confirm email* si quieres que las cuentas funcionen al momento (si lo dejas activo, el usuario debe confirmar su email antes de entrar).
4. En **Project Settings → API** copia la *Project URL* y la *anon public key* y pégalas en [`js/config.js`](js/config.js).
5. **Administrador**: la última línea de `schema.sql` define qué email será administrador. Al registrarte en la web con ese email, la cuenta se crea directamente como admin. Nadie puede darse ese rol desde la web.
6. Sube el cambio a GitHub. Listo: cuentas, chats, citas, reseñas y favoritos quedan en la nube y se sincronizan en tiempo real.

La *anon key* es pública por diseño; la seguridad la dan las políticas **RLS** incluidas en el schema (cada usuario solo ve sus propios chats y citas).

## Ejecutar en local

Es una web estática sin dependencias ni compilación:

```bash
python3 -m http.server 8080
```

y abre http://localhost:8080

## Publicación

Se publica con **GitHub Pages** desde la rama `main` (carpeta raíz).

## Estructura

```
index.html          Estructura y navegación
css/styles.css      Estética (liquid glass, animaciones, modo oscuro)
js/app.js           Vistas: inicio por rol, resumen de empresa, admin, explorar, mensajes, citas…
js/store.js         Datos: Supabase (nube) o localStorage (demo), misma interfaz
js/data.js          Categorías, búsqueda por necesidad y empresas de ejemplo
js/config.js        Claves de Supabase
supabase/           schema.sql
```

> Sin Supabase configurado, la web avisa de que no hay conexión y guarda los datos solo en ese navegador.
> El plan gratuito de Supabase pausa el proyecto tras 7 días sin ninguna visita; se reactiva desde su panel con un clic.
