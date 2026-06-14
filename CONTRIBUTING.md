# Guía de contribución

Gracias por querer mejorar Cognilab. Esta guía cubre todo lo que necesitas saber.

---

## Código de conducta

Este proyecto sigue el [Contributor Covenant](https://www.contributor-covenant.org/). Se exige respeto y colaboración constructiva en todos los canales.

---

## Cómo empezar

1. Haz **fork** del repositorio y clónalo localmente.
2. Crea una rama desde `main`: `git checkout -b feat/nombre-de-tu-cambio`
3. Sigue las instrucciones de instalación del README.
4. Haz tus cambios, escribe tests y confirma que todo funciona.
5. Abre una **Pull Request** contra `main`.

---

## Proponer un ejercicio nuevo

Usa la plantilla de issue **"Propuesta de ejercicio"** en GitHub. Incluye:

- Nombre y área cognitiva
- Descripción clínica (qué mide y por qué)
- Descripción de cómo funciona (estímulos, respuesta, niveles)
- Referencia bibliográfica si existe

Una vez aprobado, sigue las instrucciones de implementación más abajo.

---

## Implementar un ejercicio nuevo

Todos los ejercicios viven en `packages/shared/exercises/<área>/`.

### Estructura mínima

```typescript
// packages/shared/exercises/attention/my-exercise.ts

import { seededRandom } from '../../utils/random';

export interface MyExerciseStimuli {
  // define los estímulos
}

export function generate(level: number, seed: number) {
  const rng = seededRandom(seed);
  // usar rng() en lugar de Math.random() para reproducibilidad
  return {
    level,
    seed,
    timeLimit: 60,
    stimuli: { /* ... */ } as MyExerciseStimuli,
  };
}

export function evaluate(stimuli: MyExerciseStimuli, response: unknown) {
  return {
    isCorrect: false, // implementar lógica
    reactionTimeMs: 0,
    stimulus: stimuli,
    response,
  };
}

export function summarize(stimuli: MyExerciseStimuli, responses: unknown[]) {
  return { hits: 0, errors: 0, reactionTimeMs: null, rawData: {} };
}
```

### Reglas obligatorias

- **Stateless**: las funciones no guardan estado. El mismo `seed` → mismo resultado.
- **Sin `Math.random()`**: usa siempre `seededRandom(seed)` del paquete shared.
- **5 niveles**: parámetros explícitos por nivel (dificultad creciente).
- **Tests**: archivo `*.test.ts` junto al ejercicio con al menos:
  - Que `generate` devuelve el tipo correcto para cada nivel
  - Que el mismo seed devuelve siempre el mismo resultado
  - Que `evaluate` / `summarize` funcionan correctamente

### Registro del ejercicio

1. Exportar desde `packages/shared/exercises/<área>/index.ts`
2. Exportar desde `packages/shared/index.ts`
3. Añadir el slug al enum `ExerciseType` en `apps/api/prisma/schema.prisma`
4. Crear el componente player en `apps/web/src/pages/sessions/exercises/<Slug>Player.tsx`
5. Registrar en `apps/web/src/pages/sessions/exercises/renderExercise.tsx`
6. Crear el registro en la base de datos (seeder o migración)

---

## Tests

```bash
# Tests del paquete shared
pnpm --filter shared test

# Tests de la API
pnpm --filter api test

# Tests de la web
pnpm --filter web test
```

---

## Estilo de código

- TypeScript estricto — nunca `any`
- Prettier con configuración por defecto
- ESLint — `pnpm lint`
- Código en **inglés**, UI en **español**

---

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add visual-tracking exercise
fix: digit-span last digit now visible for full duration
chore: update dependencies
docs: add exercise implementation guide
test: add unit tests for stroop exercise
```

---

## Proceso de revisión

- Las PRs necesitan al menos **1 aprobación** de un maintainer.
- Los ejercicios nuevos necesitan revisión clínica además de revisión de código.
- Los tests deben pasar en CI antes de mergear.
