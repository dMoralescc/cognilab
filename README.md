# Cognilab

Plataforma web + móvil **100% gratuita y open source** para la rehabilitación y estimulación cognitiva. Orientada a neuropsicólogos, terapeutas ocupacionales y otros profesionales de la salud.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![pnpm](https://img.shields.io/badge/pnpm-monorepo-orange)](https://pnpm.io)

---

## Áreas cognitivas

Atención · Memoria · Funciones Ejecutivas · Lenguaje · Visoespacial · Orientación · Cognición Social

**60 ejercicios** listos para usar, con 5 niveles de dificultad cada uno.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend web | React 18 + Vite + Tailwind CSS + React Router v6 |
| App móvil | React Native + Expo |
| Backend | NestJS + Prisma ORM + PostgreSQL |
| Monorepo | Turborepo + pnpm workspaces |
| Lógica de ejercicios | `packages/shared` (framework-agnostic) |

---

## Requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- (Opcional) Redis para caché

---

## Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/cognilab/cognilab.git
cd cognilab

# 2. Instalar dependencias
pnpm install

# 3. Variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Editar ambos archivos con tus credenciales

# 4. Base de datos
pnpm --filter api prisma migrate deploy
pnpm --filter api prisma db seed   # opcional: datos de ejemplo

# 5. Arrancar en desarrollo
pnpm dev
```

La aplicación estará disponible en:
- Web: http://localhost:5173
- API: http://localhost:3000/api/v1
- Documentación API: http://localhost:3000/api/docs

---

## Variables de entorno

### `apps/api/.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cognilab
JWT_SECRET=cambia_esto_en_produccion
JWT_REFRESH_SECRET=cambia_esto_tambien
APP_URL=http://localhost:5173

# Email (SMTP)
MAIL_HOST=smtp.ethereal.email
MAIL_PORT=587
MAIL_USER=
MAIL_PASS=
MAIL_FROM=noreply@cognilab.app
```

### `apps/web/.env`

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### `apps/mobile/.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_WEB_URL=http://localhost:5173
```

---

## Estructura del proyecto

```
cognilab/
├── apps/
│   ├── web/          # Panel del profesional + portal del paciente
│   ├── mobile/       # App React Native (Expo)
│   └── api/          # Backend NestJS
└── packages/
    └── shared/       # Lógica de ejercicios + tipos compartidos
```

### Motor de ejercicios (`packages/shared`)

Cada ejercicio exporta dos funciones puras:

```typescript
generate(level: 1–5, seed: number): ExerciseContent
evaluate(stimulus, response): EvaluationResult
```

La lógica es **stateless** y reproducible: el mismo `seed` genera siempre el mismo contenido.

---

## API pública

La API REST está documentada con OpenAPI/Swagger en `/api/docs` cuando el servidor está en marcha.

Endpoints principales:

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/auth/login` | Login profesional |
| `POST` | `/api/v1/auth/patient/login` | Login paciente (código) |
| `GET` | `/api/v1/exercises` | Listar ejercicios |
| `GET` | `/api/v1/patients` | Listar pacientes |
| `POST` | `/api/v1/sessions` | Crear sesión |
| `GET` | `/api/v1/patient/sessions` | Sesiones del paciente (token paciente) |
| `POST` | `/api/v1/patient/results` | Enviar resultado (token paciente) |
| `GET` | `/api/v1/favorites` | Ejercicios favoritos |
| `POST` | `/api/v1/favorites/:exerciseId` | Toggle favorito |

Autenticación: `Bearer <JWT>` en header `Authorization`.

---

## Contribuir

Lee [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir una PR.

- **Nuevo ejercicio**: usa la [plantilla de propuesta](.github/ISSUE_TEMPLATE/exercise-proposal.md)
- **Bug**: abre un issue con pasos para reproducir
- **Feature**: abre primero un issue para discutir el alcance

### Convenciones

- Código en **inglés**, UI en **español**
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`)
- Tests unitarios obligatorios en todos los ejercicios de `packages/shared`
- Nunca usar `any` en TypeScript

---

## Licencia

MIT — ver [LICENSE](LICENSE)
