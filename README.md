# BusPasajes Widget

Widget para venta de pasajes de bus. Backend en **Laravel 8** y frontend en **Angular 17**.

## Estructura del proyecto

```
landWidget/
├── widget/       ← Laravel 8 (API REST)
└── frontend/     ← Angular 17 (Widget)
```

---

## Backend — Laravel

### Requisitos
- PHP 8.0+
- Composer

### Setup

```bash
cd widget

# Instalar dependencias (ya instaladas si usaste composer create-project)
composer install

# La BD SQLite ya está configurada en .env
# Ejecutar migraciones y datos de ejemplo
php artisan migrate --seed

# Iniciar servidor de desarrollo
php artisan serve
```

La API estará disponible en `http://localhost:8000/api`

### Endpoints disponibles

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/api/cities` | Lista de ciudades |
| GET | `/api/schedules/search?origin_city_id=1&destination_city_id=2&departure_date=2026-04-10&passengers=1` | Buscar horarios |
| GET | `/api/schedules/{id}/seats` | Asientos de un horario |
| POST | `/api/bookings` | Crear reserva |
| GET | `/api/bookings/{code}` | Ver reserva por código |

---

## Frontend — Angular

### Requisitos
- Node.js 18+
- npm

### Setup

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

El widget estará disponible en `http://localhost:4200`

---

## Flujo del widget

1. **Búsqueda** — Selecciona origen, destino, fecha y cantidad de pasajeros
2. **Horarios** — Lista de salidas disponibles con precio y asientos libres
3. **Asientos** — Mapa interactivo del bus para elegir asientos
4. **Pasajeros** — Datos de contacto y de cada pasajero
5. **Confirmación** — Código de reserva y resumen del viaje

---

## Base de datos (SQLite)

El archivo de base de datos se encuentra en `widget/database/database.sqlite`.

El seeder crea:
- 8 ciudades (Lima, Arequipa, Cusco, Trujillo, Chiclayo, Piura, Ica, Huancayo)
- 12 rutas bidireccionales
- ~336 horarios (4 salidas/día por ruta, 7 días)
- Asientos para cada horario (28–44 por bus según tipo)
