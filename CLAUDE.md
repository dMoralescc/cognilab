# CLAUDE.md — Cognilab

Este archivo define la arquitectura, stack, convenciones y plan de tareas del proyecto.
Léelo completo antes de empezar cualquier tarea.

---

## Descripción del proyecto

Cognilab es una plataforma web + móvil **100% gratuita y open source** para la rehabilitación y estimulación cognitiva, orientada a neuropsicólogos, terapeutas ocupacionales y otros profesionales de la salud.

**Áreas cognitivas cubiertas:** atención, memoria, funciones ejecutivas, lenguaje, habilidades visoespaciales, orientación y cognición social.

**Usuarios del sistema:**
- `Professional` — neuropsicólogo o terapeuta. Gestiona pacientes, crea sesiones y analiza resultados.
- `Patient` — accede solo a sus sesiones asignadas (portal propio, sin acceso al panel del profesional).
- `Tutor` — familiar o cuidador que asiste a un paciente (Fase 4).

---

## Stack tecnológico

### Monorepo
- **Turborepo** + **pnpm workspaces**
- Packages: `apps/web`, `apps/mobile`, `apps/api`, `packages/shared`

### Frontend web (`apps/web`)
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router v6
- Zustand (estado global)
- React Query (servidor)
- Recharts (gráficos)

### App móvil (`apps/mobile`)
- React Native + TypeScript
- Expo
- Reutiliza lógica de `packages/shared`

### Backend (`apps/api`)
- NestJS + TypeScript
- Prisma ORM
- PostgreSQL
- Redis (caché y sesiones activas)
- JWT + refresh tokens
- WebSockets (Socket.io) para telerrehabilitación en Fase 4

### Shared (`packages/shared`)
- Tipos TypeScript compartidos entre web, mobile y api
- Utilidades puras (sin dependencias de framework)
- Constantes (áreas cognitivas, niveles de dificultad, tipos de ejercicio)
- Lógica de todos los ejercicios (funciones `generate` y `evaluate`)

### Infraestructura
- **Vercel** — frontend web
- **Railway** — api + PostgreSQL + Redis
- **GitHub Actions** — CI/CD (lint, test, deploy)

---

## Estructura de carpetas

```
/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── components/
│   │       ├── pages/
│   │       ├── hooks/
│   │       ├── stores/
│   │       └── lib/
│   ├── mobile/
│   │   └── src/
│   └── api/
│       └── src/
│           ├── modules/
│           │   ├── auth/
│           │   ├── patients/
│           │   ├── exercises/
│           │   ├── sessions/
│           │   └── results/
│           └── main.ts
└── packages/
    └── shared/
        ├── types/
        ├── constants/
        ├── utils/
        └── exercises/
            ├── attention/
            ├── memory/
            ├── executive/
            ├── language/
            ├── visuospatial/
            ├── orientation/
            └── social/
```

---

## Modelos de base de datos (Prisma)

```prisma
model Professional {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String
  password  String
  patients  Patient[]
  createdAt DateTime  @default(now())
}

model Patient {
  id             String       @id @default(cuid())
  name           String
  birthDate      DateTime?
  diagnosis      String?
  notes          String?
  professionalId String
  professional   Professional @relation(fields: [professionalId], references: [id])
  sessions       Session[]
  createdAt      DateTime     @default(now())
  archivedAt     DateTime?
}

model Exercise {
  id            String        @id @default(cuid())
  slug          String        @unique
  title         String
  description   String
  cognitiveArea CognitiveArea
  type          ExerciseType
  minLevel      Int           @default(1)
  maxLevel      Int           @default(5)
  createdAt     DateTime      @default(now())
  sessionItems  SessionItem[]
}

model Session {
  id        String        @id @default(cuid())
  patientId String
  patient   Patient       @relation(fields: [patientId], references: [id])
  items     SessionItem[]
  status    SessionStatus @default(PENDING)
  startAt   DateTime?
  endAt     DateTime?
  dueDate   DateTime?
  remote    Boolean       @default(false)
  createdAt DateTime      @default(now())
}

model SessionItem {
  id         String   @id @default(cuid())
  sessionId  String
  session    Session  @relation(fields: [sessionId], references: [id])
  exerciseId String
  exercise   Exercise @relation(fields: [exerciseId], references: [id])
  level      Int      @default(1)
  order      Int
  result     Result?
}

model Result {
  id             String      @id @default(cuid())
  sessionItemId  String      @unique
  sessionItem    SessionItem @relation(fields: [sessionItemId], references: [id])
  hits           Int
  errors         Int
  reactionTimeMs Int?
  completedAt    DateTime    @default(now())
  rawData        Json?
}

enum CognitiveArea {
  ATTENTION
  MEMORY
  EXECUTIVE_FUNCTIONS
  LANGUAGE
  VISUOSPATIAL
  ORIENTATION
  SOCIAL_COGNITION
}

enum ExerciseType {
  CANCELLATION
  VISUAL_SEARCH
  GO_NO_GO
  DIVIDED_ATTENTION
  ALTERNATING_ATTENTION
  ATTENTION_SPAN
  REACTION_TIME
  VIGILANCE
  AUDITORY_ATTENTION
  VISUAL_TRACKING
  DIGIT_SPAN
  IMAGE_PAIRS
  POSITION_SEQUENCES
  FACE_MEMORY
  WORD_MEMORY
  STORY_MEMORY
  PROSPECTIVE_MEMORY
  SEMANTIC_MEMORY
  VISUAL_RECOGNITION
  SPATIAL_WORKING_MEMORY
  EPISODIC_MEMORY
  VISUOSPATIAL_SPAN
  STROOP
  TRAIL_MAKING
  TOWER_OF_HANOI
  ROUTE_PLANNING
  INHIBITION
  COGNITIVE_FLEXIBILITY
  ABSTRACT_REASONING
  CATEGORIZATION
  PROBLEM_SOLVING
  DESIGN_FLUENCY
  N_BACK
  DUAL_TASK
  PHONOLOGICAL_FLUENCY
  SEMANTIC_FLUENCY
  NAMING
  COMPREHENSION
  REPETITION
  READING
  WRITING
  PROSODY
  MENTAL_ROTATION
  FIGURE_COPY
  PUZZLE
  MAZE
  DEPTH_PERCEPTION
  OBJECT_ASSEMBLY
  SHAPE_DISCRIMINATION
  LINE_ORIENTATION
  TEMPORAL_ORIENTATION
  SPATIAL_ORIENTATION
  PERSONAL_ORIENTATION
  SITUATIONAL_ORIENTATION
  EMOTION_RECOGNITION
  THEORY_OF_MIND
  EMPATHY
  PERSPECTIVE_TAKING
  MORAL_COGNITION
  NONVERBAL_COMMUNICATION
}

enum SessionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  EXPIRED
}
```

---

## Convenciones de código

- **Idioma del código:** inglés (variables, funciones, tipos, comentarios)
- **Idioma de la UI:** español
- **Formato:** Prettier con config por defecto
- **Linting:** ESLint + reglas de TypeScript strict
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **Ramas:** `main` (producción), `dev` (desarrollo), `feat/nombre-tarea` (por tarea)
- **Tests:** Vitest para web/shared, Jest para api. Tests unitarios obligatorios en todos los ejercicios.
- **Nunca** usar `any` en TypeScript.
- **Siempre** hacer commit al completar cada tarea antes de empezar la siguiente.

---

## Motor de ejercicios — reglas

Cada ejercicio en `packages/shared/exercises/` debe:

1. Aceptar un `seed` para generar variantes reproducibles.
2. Tener entre 1 y 5 niveles con parámetros explícitos por nivel.
3. Registrar por cada respuesta: `isCorrect`, `reactionTimeMs`, `stimulus`, `response`.
4. Ser completamente stateless.
5. Exportar `generate(level, seed)` → contenido del ejercicio.
6. Exportar `evaluate(stimulus, response)` → resultado de la respuesta.

```typescript
export interface ExerciseContent<T> {
  level: number;
  seed: number;
  timeLimit: number;
  stimuli: T;
}

export interface EvaluationResult {
  isCorrect: boolean;
  reactionTimeMs: number;
  stimulus: unknown;
  response: unknown;
}
```

---

## Librería completa de ejercicios

### ATENCIÓN

#### 2.1 — Cancelación de símbolos (`cancellation`)
- **Qué mide:** atención selectiva y velocidad de procesamiento.
- **Cómo funciona:** cuadrícula de símbolos. El usuario pulsa todos los que coincidan con el símbolo objetivo.
- **Niveles:** 1→5×5, 1 distractor | 2→7×7, 2 distractores | 3→9×9, 3 distractores | 4→10×10, 4 distractores | 5→12×12, 5 distractores similares al objetivo.
- **Parámetros:** `gridSize`, `targetSymbol`, `distractors[]`, `timeLimit`.
- **Métricas:** aciertos, omisiones, comisiones, tiempo total.

#### 2.2 — Búsqueda visual (`visual_search`)
- **Qué mide:** atención selectiva y velocidad de búsqueda.
- **Cómo funciona:** encontrar un elemento objetivo entre distractores distribuidos en pantalla.
- **Niveles:** 1→10 elementos, objetivo muy diferente | 5→40 elementos, objetivo similar a distractores.
- **Parámetros:** `itemCount`, `target`, `distractors[]`, `layout`.
- **Métricas:** tiempo hasta encontrar, aciertos, errores.

#### 2.3 — Go/No-Go (`go_no_go`)
- **Qué mide:** atención sostenida e inhibición de respuesta.
- **Cómo funciona:** pulsar solo cuando aparece el estímulo objetivo (go), no pulsar ante el distractor (no-go).
- **Niveles:** 1→80% go, estímulos simples | 5→50% go, estímulos similares, ritmo rápido.
- **Parámetros:** `goRatio`, `stimulusDuration`, `isi`, `totalTrials`.
- **Métricas:** omisiones (fallos go), comisiones (fallos no-go), tiempo de reacción medio.

#### 2.4 — Atención dividida (`divided_attention`)
- **Qué mide:** capacidad de atender a dos fuentes simultáneamente.
- **Cómo funciona:** dos tareas en paralelo en pantalla.
- **Niveles:** 1→tareas simples, lento | 5→tareas complejas, rápido.
- **Parámetros:** `task1Config`, `task2Config`, `duration`.
- **Métricas:** rendimiento en cada tarea por separado y combinado.

#### 2.5 — Atención alternante (`alternating_attention`)
- **Qué mide:** flexibilidad atencional, cambio de foco.
- **Cómo funciona:** alternar entre dos reglas de respuesta según una señal visual.
- **Niveles:** 1→señal clara, cambio lento | 5→señal sutil, cambios frecuentes.
- **Parámetros:** `switchRate`, `signalType`, `stimuliPerBlock`.
- **Métricas:** aciertos por bloque, coste de cambio.

#### 2.6 — Span atencional (`attention_span`)
- **Qué mide:** amplitud de la atención visual.
- **Cómo funciona:** se iluminan brevemente N elementos. El usuario indica cuáles eran.
- **Niveles:** 1→3 elementos, 2s exposición | 5→8 elementos, 0.5s exposición.
- **Parámetros:** `spanSize`, `exposureTime`, `gridSize`.
- **Métricas:** span máximo correcto, errores por posición.

#### 2.7 — Tiempo de reacción (`reaction_time`)
- **Qué mide:** velocidad de procesamiento y respuesta.
- **Cómo funciona:** pulsar lo más rápido posible cuando aparece el estímulo.
- **Niveles:** 1→estímulo simple, intervalo predecible | 5→elección 4 opciones, intervalo aleatorio.
- **Parámetros:** `stimulusType`, `isi`, `trials`, `choiceCount`.
- **Métricas:** tiempo de reacción medio, desviación típica, anticipaciones, omisiones.

#### 2.8 — Vigilancia (`vigilance`)
- **Qué mide:** atención sostenida durante tareas largas.
- **Cómo funciona:** tarea monótona de detección de estímulos infrecuentes durante un período prolongado.
- **Niveles:** 1→5 min, señal frecuente | 5→15 min, señal muy infrecuente (5%).
- **Parámetros:** `duration`, `signalRate`, `stimulusDuration`.
- **Métricas:** detecciones correctas, omisiones, falsas alarmas, decremento de vigilancia.

#### 2.9 — Atención selectiva auditiva (`auditory_attention`)
- **Qué mide:** atención selectiva en modalidad auditiva.
- **Cómo funciona:** escuchar secuencia de palabras/letras y pulsar solo ante el objetivo.
- **Niveles:** 1→ritmo lento, objetivo diferente | 5→ritmo rápido, objetivo fonéticamente similar.
- **Parámetros:** `sequence[]`, `target`, `rate`.
- **Métricas:** aciertos, omisiones, comisiones.

#### 2.10 — Seguimiento visual (`visual_tracking`)
- **Qué mide:** atención visual sostenida y seguimiento de objetos en movimiento.
- **Cómo funciona:** seguir uno o varios objetos en movimiento entre distractores idénticos.
- **Niveles:** 1→1 objeto, lento | 5→4 objetos, rápido, con oclusiones.
- **Parámetros:** `targetCount`, `speed`, `distractorCount`, `occlusionRate`.
- **Métricas:** aciertos de identificación final, precisión de seguimiento.

---

### MEMORIA

#### 2.11 — Dígitos directos e inversos (`digit_span`)
- **Qué mide:** memoria de trabajo verbal.
- **Cómo funciona:** reproducir secuencia de dígitos en orden directo o inverso.
- **Niveles:** 1→3 dígitos directo | 3→5 dígitos directo | 5→6 dígitos inverso.
- **Parámetros:** `sequenceLength`, `modality`, `direction`.
- **Métricas:** span máximo, errores por posición.

#### 2.12 — Pares de imágenes (`image_pairs`)
- **Qué mide:** memoria visual y aprendizaje asociativo.
- **Cómo funciona:** estudiar pares de imágenes, después encontrar la pareja de cada una.
- **Niveles:** 1→4 pares, categorías distintas | 5→12 pares, imágenes similares.
- **Parámetros:** `pairCount`, `exposureTime`, `delayTime`, `imageCategories[]`.
- **Métricas:** aciertos, intentos por par, tiempo.

#### 2.13 — Secuencias de posiciones (`position_sequences`)
- **Qué mide:** memoria visoespacial y de trabajo espacial.
- **Cómo funciona:** reproducir la secuencia de casillas iluminadas en una cuadrícula.
- **Niveles:** 1→3 posiciones | 5→8 posiciones con interferencia.
- **Parámetros:** `sequenceLength`, `gridSize`, `speed`.
- **Métricas:** secuencias correctas, errores de posición, errores de orden.

#### 2.14 — Memoria de caras (`face_memory`)
- **Qué mide:** memoria episódica visual para caras.
- **Cómo funciona:** estudiar caras, identificarlas después entre caras nuevas.
- **Niveles:** 1→4 caras, muy distintas | 5→12 caras, similares.
- **Parámetros:** `faceCount`, `studyTime`, `delayTime`, `distractorCount`.
- **Métricas:** reconocimientos correctos, falsas alarmas, omisiones.

#### 2.15 — Memoria de palabras (`word_memory`)
- **Qué mide:** memoria verbal episódica.
- **Cómo funciona:** recordar palabras de una lista (reconocimiento o recuerdo libre).
- **Niveles:** 1→5 palabras concretas | 5→15 palabras abstractas con interferentes.
- **Parámetros:** `wordCount`, `modality`, `taskType`, `delayTime`.
- **Métricas:** palabras recordadas, intrusiones, omisiones.

#### 2.16 — Memoria de historias (`story_memory`)
- **Qué mide:** memoria episódica verbal y comprensión.
- **Cómo funciona:** responder preguntas sobre una historia tras leerla/escucharla.
- **Niveles:** 1→5 unidades de información | 5→20 unidades, detalles periféricos.
- **Parámetros:** `story`, `questions[]`, `delayTime`.
- **Métricas:** unidades recordadas en recuerdo inmediato y demorado.

#### 2.17 — Memoria prospectiva (`prospective_memory`)
- **Qué mide:** recordar realizar una acción futura.
- **Cómo funciona:** durante una tarea principal, recordar pulsar cuando aparezca un estímulo específico.
- **Niveles:** 1→1 intención, señal obvia | 5→2 intenciones simultáneas, señal sutil.
- **Parámetros:** `intentionCount`, `signalType`, `mainTaskDuration`.
- **Métricas:** intenciones completadas, omisiones, activaciones prematuras.

#### 2.18 — Memoria semántica (`semantic_memory`)
- **Qué mide:** conocimiento general almacenado.
- **Cómo funciona:** preguntas sobre conocimiento general, definiciones, categorías.
- **Niveles:** 1→conocimiento muy familiar | 5→categorías menos frecuentes.
- **Parámetros:** `questionBank[]`, `category`, `difficulty`.
- **Métricas:** aciertos, tiempo de respuesta.

#### 2.19 — Reconocimiento visual (`visual_recognition`)
- **Qué mide:** memoria de reconocimiento para objetos visuales.
- **Cómo funciona:** estudiar imágenes de objetos, identificarlos después entre objetos nuevos.
- **Niveles:** 1→8 objetos, categorías distintas | 5→20 objetos, misma categoría, ángulos distintos.
- **Parámetros:** `itemCount`, `studyTime`, `distractorSimilarity`.
- **Métricas:** hits, falsas alarmas, d-prime.

#### 2.20 — Memoria de trabajo espacial (`spatial_working_memory`)
- **Qué mide:** manipulación activa de información espacial.
- **Cómo funciona:** recordar posiciones y actualizarlas mentalmente cuando cambian.
- **Niveles:** 1→3 objetos, sin actualización | 5→6 objetos, múltiples actualizaciones.
- **Parámetros:** `objectCount`, `updateCount`, `gridSize`.
- **Métricas:** posiciones finales correctas, errores de actualización.

#### 2.21 — Memoria episódica (`episodic_memory`)
- **Qué mide:** memoria de eventos con contexto temporal y espacial.
- **Cómo funciona:** recordar qué objeto estaba en qué lugar y cuándo.
- **Niveles:** 1→4 objetos, 2 lugares | 5→10 objetos, 4 lugares, 2 tiempos.
- **Parámetros:** `objectCount`, `locationCount`, `timeContexts`, `delayTime`.
- **Métricas:** asociaciones correctas, errores de atribución de contexto.

#### 2.22 — Span visoespacial (`visuospatial_span`)
- **Qué mide:** amplitud de la memoria visoespacial (equivalente Corsi Block).
- **Cómo funciona:** tocar bloques en el mismo orden en que se iluminaron.
- **Niveles:** 1→3 bloques | 5→9 bloques con interferencia visual.
- **Parámetros:** `blockCount`, `sequenceLength`, `speed`.
- **Métricas:** span máximo correcto.

---

### FUNCIONES EJECUTIVAS

#### 2.23 — Stroop adaptado (`stroop`)
- **Qué mide:** inhibición de respuesta automática, control cognitivo.
- **Cómo funciona:** decir el color de la tinta de una palabra, no la palabra.
- **Niveles:** 1→congruente | 3→incongruente | 5→incongruente con tiempo límite estricto.
- **Parámetros:** `trialType`, `timeLimit`, `trials`.
- **Métricas:** aciertos, errores de interferencia, tiempo de reacción, efecto Stroop.

#### 2.24 — Trail Making A y B (`trail_making`)
- **Qué mide:** A→velocidad visomotora; B→flexibilidad cognitiva.
- **Cómo funciona:** A: conectar números en orden. B: alternar números y letras (1→A→2→B…).
- **Niveles:** 1→10 elementos, distribución clara | 5→25 elementos, distribución densa.
- **Parámetros:** `version`, `elementCount`, `canvasSize`.
- **Métricas:** tiempo de compleción, errores, correcciones.

#### 2.25 — Torre de Hanói (`tower_of_hanoi`)
- **Qué mide:** planificación, resolución de problemas, memoria de trabajo.
- **Cómo funciona:** mover discos entre tres postes (disco mayor nunca encima de menor).
- **Niveles:** 1→3 discos (7 movimientos mínimos) | 5→6 discos (63 movimientos mínimos).
- **Parámetros:** `diskCount`, `moveLimit`, `timeLimit`.
- **Métricas:** movimientos totales, movimientos extra sobre el mínimo, errores de regla.

#### 2.26 — Planificación de rutas (`route_planning`)
- **Qué mide:** planificación y razonamiento espacial.
- **Cómo funciona:** planificar la ruta más eficiente en un mapa para visitar todos los puntos.
- **Niveles:** 1→4 puntos, mapa simple | 5→8 puntos, restricciones de orden.
- **Parámetros:** `mapConfig`, `pointCount`, `constraints[]`.
- **Métricas:** eficiencia de la ruta, restricciones cumplidas, tiempo de planificación.

#### 2.27 — Inhibición (`inhibition`)
- **Qué mide:** capacidad de suprimir respuestas prepotentes.
- **Cómo funciona:** stop-signal task: responder a un estímulo pero inhibir la respuesta ante la señal de stop.
- **Niveles:** 1→señal de stop frecuente y temprana | 5→señal infrecuente y tardía.
- **Parámetros:** `stopSignalDelay`, `stopRate`, `trials`.
- **Métricas:** SSRT, tasa de inhibición exitosa.

#### 2.28 — Flexibilidad cognitiva (`cognitive_flexibility`)
- **Qué mide:** cambio entre reglas o sets mentales.
- **Cómo funciona:** clasificar tarjetas según una regla que cambia sin aviso explícito.
- **Niveles:** 1→señal explícita, 2 reglas | 5→sin señal, 4 reglas, cambios frecuentes.
- **Parámetros:** `rules[]`, `switchFrequency`, `feedbackType`.
- **Métricas:** aciertos, errores perseverativos, coste de cambio.

#### 2.29 — Razonamiento abstracto (`abstract_reasoning`)
- **Qué mide:** inteligencia fluida, razonamiento inductivo.
- **Cómo funciona:** matrices de patrones visuales, encontrar el elemento que completa la secuencia.
- **Niveles:** 1→patrón simple, 1 regla | 5→patrón complejo, 3 reglas combinadas.
- **Parámetros:** `matrixSize`, `ruleCount`, `distractorType`.
- **Métricas:** aciertos, tiempo por ítem.

#### 2.30 — Categorización (`categorization`)
- **Qué mide:** formación de conceptos, organización semántica.
- **Cómo funciona:** clasificar objetos en categorías o encontrar el elemento que no pertenece.
- **Niveles:** 1→categorías básicas, diferencias obvias | 5→subcategorías, criterios ambiguos.
- **Parámetros:** `categories[]`, `itemsPerCategory`, `taskType`.
- **Métricas:** clasificaciones correctas, tiempo, errores por categoría.

#### 2.31 — Resolución de problemas (`problem_solving`)
- **Qué mide:** razonamiento práctico y resolución de problemas cotidianos.
- **Cómo funciona:** situaciones de la vida diaria con un problema, elegir la mejor solución.
- **Niveles:** 1→problema simple, solución obvia | 5→problema complejo, consecuencias a largo plazo.
- **Parámetros:** `scenarios[]`, `optionCount`, `timeLimit`.
- **Métricas:** soluciones óptimas elegidas, tiempo de decisión.

#### 2.32 — Fluidez de diseño (`design_fluency`)
- **Qué mide:** creatividad, generación de alternativas.
- **Cómo funciona:** dibujar el máximo de figuras distintas combinando líneas en una cuadrícula de puntos.
- **Niveles:** 1→60s, líneas libres | 5→60s, solo líneas curvas, sin repetir.
- **Parámetros:** `timeLimit`, `lineConstraints`, `dotGrid`.
- **Métricas:** número de diseños únicos, perseveraciones.

#### 2.33 — N-back (`n_back`)
- **Qué mide:** memoria de trabajo y actualización.
- **Cómo funciona:** indicar si el estímulo actual es igual al de N posiciones atrás.
- **Niveles:** 1→1-back visual | 3→2-back auditivo | 5→3-back dual.
- **Parámetros:** `n`, `modality`, `sequenceLength`, `targetRate`.
- **Métricas:** hits, falsas alarmas, d-prime, tiempo de reacción.

#### 2.34 — Doble tarea (`dual_task`)
- **Qué mide:** capacidad de realizar dos tareas cognitivas simultáneamente.
- **Cómo funciona:** ejecutar dos tareas al mismo tiempo.
- **Niveles:** 1→tareas simples independientes | 5→tareas complejas con interferencia máxima.
- **Parámetros:** `task1`, `task2`, `duration`, `priorityInstruction`.
- **Métricas:** rendimiento en cada tarea sola vs combinada, coste de la doble tarea.

---

### LENGUAJE

#### 2.35 — Fluidez verbal fonológica (`phonological_fluency`)
- **Qué mide:** acceso léxico por fonema.
- **Cómo funciona:** escribir el máximo de palabras que empiecen por una letra en tiempo limitado.
- **Niveles:** 1→letras frecuentes (M, S, P), 90s | 5→letras infrecuentes (R, F), 45s.
- **Parámetros:** `letter`, `timeLimit`, `excludedCategories[]`.
- **Métricas:** palabras válidas, perseveraciones, intrusiones.

#### 2.36 — Fluidez semántica (`semantic_fluency`)
- **Qué mide:** organización semántica y acceso a categorías.
- **Cómo funciona:** escribir el máximo de elementos de una categoría en tiempo limitado.
- **Niveles:** 1→categorías amplias (animales), 90s | 5→subcategorías específicas, 45s.
- **Parámetros:** `category`, `timeLimit`, `subcategoryConstraint`.
- **Métricas:** palabras válidas, clustering semántico, switching entre subgrupos.

#### 2.37 — Denominación (`naming`)
- **Qué mide:** acceso léxico, memoria semántica.
- **Cómo funciona:** nombrar objetos mostrados en imágenes.
- **Niveles:** 1→objetos de alta frecuencia léxica | 5→objetos de baja frecuencia, partes de objetos.
- **Parámetros:** `imageBank[]`, `modality`, `timePerItem`.
- **Métricas:** denominaciones correctas, parafasias, circunloquios.

#### 2.38 — Comprensión (`comprehension`)
- **Qué mide:** comprensión del lenguaje oral y escrito.
- **Cómo funciona:** escuchar/leer órdenes y ejecutarlas o responder preguntas.
- **Niveles:** 1→órdenes simples de 1 paso | 5→frases sintácticamente complejas, 3 pasos.
- **Parámetros:** `stimuli[]`, `taskType`, `syntaxComplexity`.
- **Métricas:** órdenes ejecutadas correctamente, comprensión de inferencias.

#### 2.39 — Repetición (`repetition`)
- **Qué mide:** bucle fonológico, memoria de trabajo verbal.
- **Cómo funciona:** escuchar palabras, pseudopalabras o frases y reproducirlas.
- **Niveles:** 1→palabras frecuentes, 2 sílabas | 5→frases largas, pseudopalabras de 5 sílabas.
- **Parámetros:** `stimuli[]`, `stimulusType`, `length`.
- **Métricas:** repeticiones exactas, errores fonémicos, errores de longitud.

#### 2.40 — Lectura (`reading`)
- **Qué mide:** decodificación lectora, velocidad y comprensión.
- **Cómo funciona:** leer textos con preguntas de comprensión.
- **Niveles:** 1→palabras regulares, alta frecuencia | 5→vocabulario especializado, preguntas inferenciales.
- **Parámetros:** `text`, `taskType`, `questions[]`.
- **Métricas:** palabras por minuto, errores de decodificación, comprensión.

#### 2.41 — Escritura (`writing`)
- **Qué mide:** producción escrita, ortografía.
- **Cómo funciona:** escribir palabras al dictado, copiar texto o producción espontánea.
- **Niveles:** 1→palabras simples al dictado | 5→dictado de frases complejas.
- **Parámetros:** `stimuli[]`, `taskType`, `timeLimit`.
- **Métricas:** errores ortográficos, omisiones, sustituciones, velocidad.

#### 2.42 — Prosodia (`prosody`)
- **Qué mide:** comprensión de la entonación y el ritmo del habla.
- **Cómo funciona:** identificar la emoción o intención comunicativa en frases por su entonación.
- **Niveles:** 1→emociones básicas, entonación exagerada | 5→emociones sutiles, contexto ambiguo.
- **Parámetros:** `audioStimuli[]`, `emotionLabels[]`, `contextType`.
- **Métricas:** identificaciones correctas, confusiones por tipo de emoción.

---

### VISOESPACIAL

#### 2.43 — Rotación mental (`mental_rotation`)
- **Qué mide:** habilidad visoespacial, razonamiento espacial.
- **Cómo funciona:** decidir si dos figuras son iguales o imágenes especulares, rotadas en distintos ángulos.
- **Niveles:** 1→figuras simples 2D, 45° | 5→figuras 3D complejas, cualquier ángulo.
- **Parámetros:** `figureComplexity`, `rotationAngle`, `is3D`, `trials`.
- **Métricas:** aciertos, tiempo de reacción, efecto del ángulo de rotación.

#### 2.44 — Copia de figuras (`figure_copy`)
- **Qué mide:** organización perceptiva, planificación constructiva.
- **Cómo funciona:** copiar una figura geométrica sobre una cuadrícula de puntos.
- **Niveles:** 1→figuras simples, ángulos rectos | 5→figura compleja tipo Rey.
- **Parámetros:** `figure`, `gridType`, `timeLimit`.
- **Métricas:** puntuación por elementos correctos, organización global vs detalles.

#### 2.45 — Rompecabezas (`puzzle`)
- **Qué mide:** síntesis visoespacial, razonamiento perceptivo.
- **Cómo funciona:** ensamblar piezas para reconstruir una imagen.
- **Niveles:** 1→4 piezas, imagen simple | 5→25 piezas, imagen compleja, piezas rotadas.
- **Parámetros:** `pieceCount`, `imageComplexity`, `rotation`, `timeLimit`.
- **Métricas:** tiempo de compleción, movimientos, errores de colocación.

#### 2.46 — Laberintos (`maze`)
- **Qué mide:** planificación visoespacial, resolución de problemas.
- **Cómo funciona:** encontrar la salida navegando el laberinto.
- **Niveles:** 1→laberinto 5×5, camino único | 5→laberinto 15×15, múltiples caminos falsos.
- **Parámetros:** `gridSize`, `complexity`, `deadEndCount`, `timeLimit`.
- **Métricas:** tiempo, errores, retrocesos.

#### 2.47 — Percepción de profundidad (`depth_perception`)
- **Qué mide:** percepción espacial tridimensional.
- **Cómo funciona:** ordenar objetos por distancia aparente o identificar cuál está más cerca/lejos.
- **Niveles:** 1→diferencias grandes, señales claras | 5→diferencias sutiles, escenas complejas.
- **Parámetros:** `sceneComplexity`, `depthCues[]`, `itemCount`.
- **Métricas:** ordenaciones correctas, errores por tipo de señal.

#### 2.48 — Ensamblaje de objetos (`object_assembly`)
- **Qué mide:** síntesis visual, reconocimiento de objetos fragmentados.
- **Cómo funciona:** identificar un objeto a partir de sus partes desordenadas.
- **Niveles:** 1→objeto familiar, pocas piezas | 5→objeto poco familiar, piezas rotadas.
- **Parámetros:** `objectComplexity`, `pieceCount`, `rotation`, `timeLimit`.
- **Métricas:** identificación correcta, tiempo, piezas colocadas.

#### 2.49 — Discriminación de formas (`shape_discrimination`)
- **Qué mide:** percepción visual, discriminación de formas similares.
- **Cómo funciona:** identificar la figura idéntica al modelo entre varios distractores similares.
- **Niveles:** 1→formas básicas, diferencias obvias | 5→formas complejas, diferencias mínimas.
- **Parámetros:** `target`, `distractors[]`, `similarityLevel`, `timeLimit`.
- **Métricas:** aciertos, falsos positivos, tiempo.

#### 2.50 — Orientación de líneas (`line_orientation`)
- **Qué mide:** percepción de ángulos y orientación espacial.
- **Cómo funciona:** hacer coincidir la orientación de líneas modelo con un abanico de referencia.
- **Niveles:** 1→diferencias de 45°, 2 líneas | 5→diferencias de 18°, 3 líneas simultáneas.
- **Parámetros:** `lineCount`, `angleDifference`, `referenceLines`.
- **Métricas:** aciertos, error medio en grados.

---

### ORIENTACIÓN

#### 2.51 — Orientación temporal (`temporal_orientation`)
- **Qué mide:** orientación en el tiempo.
- **Cómo funciona:** preguntas sobre día, fecha, mes, año, estación, hora aproximada.
- **Niveles:** 1→año y estación | 3→mes y día | 5→fecha exacta y hora.
- **Parámetros:** `questionTypes[]`, `currentDateTime`.
- **Métricas:** respuestas correctas por categoría temporal.

#### 2.52 — Orientación espacial (`spatial_orientation`)
- **Qué mide:** orientación en el espacio.
- **Cómo funciona:** preguntas sobre lugar actual, ciudad, país; identificar ubicaciones en mapa.
- **Niveles:** 1→país y ciudad | 3→barrio y tipo de lugar | 5→planta del edificio, orientación cardinal.
- **Parámetros:** `locationContext`, `questionTypes[]`, `mapTasks[]`.
- **Métricas:** aciertos por categoría espacial.

#### 2.53 — Orientación personal (`personal_orientation`)
- **Qué mide:** orientación en relación a la propia identidad.
- **Cómo funciona:** preguntas sobre nombre, edad, profesión, familia, datos biográficos.
- **Niveles:** 1→nombre y edad | 3→profesión y familiares | 5→datos biográficos específicos.
- **Parámetros:** `patientProfile` (configurado por el profesional para cada paciente).
- **Métricas:** aciertos, confabulaciones detectadas.

#### 2.54 — Orientación situacional (`situational_orientation`)
- **Qué mide:** comprensión del contexto y la situación actual.
- **Cómo funciona:** preguntas sobre por qué está en ese lugar, qué está haciendo, quién le acompaña.
- **Niveles:** 1→contexto muy familiar | 5→contexto nuevo o inusual.
- **Parámetros:** `situationContext`, `questions[]`.
- **Métricas:** respuestas contextualmente apropiadas.

---

### COGNICIÓN SOCIAL

#### 2.55 — Reconocimiento de emociones (`emotion_recognition`)
- **Qué mide:** procesamiento emocional básico.
- **Cómo funciona:** identificar la emoción expresada en una cara entre varias opciones.
- **Niveles:** 1→emociones básicas, expresión intensa | 5→emociones complejas, expresión sutil.
- **Parámetros:** `emotionSet[]`, `intensity`, `faceType`.
- **Métricas:** aciertos por emoción, matriz de confusión emocional.

#### 2.56 — Teoría de la mente (`theory_of_mind`)
- **Qué mide:** inferir estados mentales ajenos.
- **Cómo funciona:** historias donde hay que inferir qué piensa o siente un personaje.
- **Niveles:** 1→creencias de primer orden | 3→segundo orden | 5→faux pas, ironía.
- **Parámetros:** `scenarios[]`, `orderLevel`, `taskType`.
- **Métricas:** inferencias correctas, tipo de error.

#### 2.57 — Empatía (`empathy`)
- **Qué mide:** comprensión y compartición de estados emocionales ajenos.
- **Cómo funciona:** situaciones sociales donde elegir la respuesta más empática.
- **Niveles:** 1→situaciones claras, emociones obvias | 5→situaciones ambiguas, dilemas sociales.
- **Parámetros:** `scenarios[]`, `responseOptions[]`, `culturalContext`.
- **Métricas:** respuestas empáticas apropiadas.

#### 2.58 — Toma de perspectiva (`perspective_taking`)
- **Qué mide:** adoptar el punto de vista de otra persona.
- **Cómo funciona:** variante visual (¿qué ve el personaje?) y cognitiva (¿qué sabe el personaje?).
- **Niveles:** 1→perspectiva visual simple | 5→perspectiva cognitiva compleja.
- **Parámetros:** `sceneConfig`, `perspectiveType`, `complexity`.
- **Métricas:** aciertos, errores egocéntricos.

#### 2.59 — Cognición moral (`moral_cognition`)
- **Qué mide:** razonamiento moral y juicio social.
- **Cómo funciona:** dilemas morales donde evaluar la adecuación de una acción.
- **Niveles:** 1→dilemas simples, consecuencias directas | 5→dilemas complejos, contexto ambiguo.
- **Parámetros:** `dilemmas[]`, `responseScale`, `justificationRequired`.
- **Métricas:** tipo de razonamiento, consistencia, tiempo de decisión.

#### 2.60 — Comunicación no verbal (`nonverbal_communication`)
- **Qué mide:** comprensión de gestos, postura y lenguaje corporal.
- **Cómo funciona:** identificar el significado de gestos o posturas en imágenes.
- **Niveles:** 1→gestos universales, significado claro | 5→gestos culturalmente específicos.
- **Parámetros:** `stimuli[]`, `gestureType`, `culturalContext`.
- **Métricas:** aciertos, confusiones por tipo de gesto.

---

## Plan de tareas completo (73 tareas)

### FASE 1 — MVP (Semanas 1–8)

#### Infraestructura & Auth
- [ ] **1.1** Setup monorepo — Turborepo + pnpm. Packages: web, mobile, api, shared.
- [ ] **1.2** Base de datos — PostgreSQL con Prisma. Aplicar schema completo.
- [ ] **1.3** Auth profesional — Registro/login con JWT + refresh tokens. Email de verificación.
- [ ] **1.4** CI/CD básico — GitHub Actions: lint, test, deploy a Vercel y Railway.

#### Gestión de Pacientes
- [ ] **1.5** CRUD de pacientes — Crear, editar, archivar. Campos: nombre, fecha de nacimiento, diagnóstico, notas.
- [ ] **1.6** Dashboard del profesional — Lista de pacientes, estado, última sesión, acceso rápido.
- [ ] **1.7** Perfil de paciente — Historial de sesiones, gráfico de evolución, notas clínicas.

#### Motor de Ejercicios
- [ ] **1.8** Modelo de ejercicio — Schema JSON, tipos en shared, funciones generate y evaluate.
- [ ] **1.9** Motor de variantes — Generador con semillas. Mismo ejercicio, contenido siempre distinto.
- [ ] **1.10** Registro de resultados — Guardar aciertos, errores, tiempo de reacción y nivel.

#### Sesiones
- [ ] **1.11** Creador de sesiones — Selección de ejercicios, parámetros, asignación a paciente.
- [ ] **1.12** Reproductor de sesión — UI limpia, transiciones, temporizador, feedback inmediato.
- [ ] **1.13** Resumen post-sesión — Resultados, comparación con sesión anterior, notas.

---

### FASE 2 — Ejercicios cognitivos (Semanas 9–20)

#### Atención
- [x] **2.1** Cancelación de símbolos
- [x] **2.2** Búsqueda visual
- [x] **2.3** Go/No-Go
- [x] **2.4** Atención dividida
- [x] **2.5** Atención alternante
- [x] **2.6** Span atencional
- [x] **2.7** Tiempo de reacción
- [x] **2.8** Vigilancia
- [x] **2.9** Atención selectiva auditiva
- [x] **2.10** Seguimiento visual

#### Memoria
- [x] **2.11** Dígitos directos e inversos
- [x] **2.12** Pares de imágenes
- [x] **2.13** Secuencias de posiciones
- [x] **2.14** Memoria de caras
- [x] **2.15** Memoria de palabras
- [x] **2.16** Memoria de historias
- [x] **2.17** Memoria prospectiva
- [x] **2.18** Memoria semántica
- [x] **2.19** Reconocimiento visual
- [x] **2.20** Memoria de trabajo espacial
- [x] **2.21** Memoria episódica
- [x] **2.22** Span visoespacial

#### Funciones ejecutivas
- [x] **2.23** Stroop adaptado
- [x] **2.24** Trail Making A y B
- [x] **2.25** Torre de Hanói
- [x] **2.26** Planificación de rutas
- [x] **2.27** Inhibición (stop-signal)
- [x] **2.28** Flexibilidad cognitiva
- [x] **2.29** Razonamiento abstracto
- [x] **2.30** Categorización
- [x] **2.31** Resolución de problemas
- [x] **2.32** Fluidez de diseño
- [x] **2.33** N-back
- [x] **2.34** Doble tarea

#### Lenguaje
- [x] **2.35** Fluidez verbal fonológica
- [x] **2.36** Fluidez semántica
- [x] **2.37** Denominación
- [x] **2.38** Comprensión
- [x] **2.39** Repetición
- [x] **2.40** Lectura
- [x] **2.41** Escritura
- [x] **2.42** Prosodia

#### Visoespacial
- [x] **2.43** Rotación mental
- [x] **2.44** Copia de figuras
- [x] **2.45** Rompecabezas
- [x] **2.46** Laberintos
- [x] **2.47** Percepción de profundidad
- [x] **2.48** Ensamblaje de objetos
- [x] **2.49** Discriminación de formas
- [x] **2.50** Orientación de líneas

#### Orientación
- [x] **2.51** Orientación temporal
- [x] **2.52** Orientación espacial
- [x] **2.53** Orientación personal
- [x] **2.54** Orientación situacional

#### Cognición social
- [x] **2.55** Reconocimiento de emociones
- [x] **2.56** Teoría de la mente
- [x] **2.57** Empatía
- [x] **2.58** Toma de perspectiva
- [x] **2.59** Cognición moral
- [x] **2.60** Comunicación no verbal

---

### FASE 3 — Métricas & Contenido (Semanas 21–26)

- [x] **3.1** Ajuste automático de dificultad — Algoritmo basado en % de aciertos en últimas N sesiones.
- [x] **3.2** Dashboard de métricas avanzado — Gráficos por área cognitiva, tendencias, comparativas.
- [x] **3.3** Informes en PDF — Exportación de progreso con gráficos y tabla de resultados.
- [x] **3.4** Fichas imprimibles — Versiones en papel de los ejercicios digitales.
- [x] **3.5** Plantillas personalizables — Logo del centro, nombre del paciente, fecha.
- [x] **3.6** Biblioteca con búsqueda y filtros — Por área, nivel, tipo y duración.
- [x] **3.7** Programas por patología — Ictus, Alzheimer, TDAH, daño cerebral, Parkinson, esclerosis múltiple.

---

### FASE 4 — Telerrehabilitación (Semanas 27–32)

- [ ] **4.1** Portal del paciente — Acceso independiente. Solo ve sus sesiones asignadas.
- [ ] **4.2** Asignación de sesiones en remoto — El profesional programa sesiones con rango de fechas.
- [ ] **4.3** Notificaciones — Email/push al paciente con sesiones pendientes y recordatorios.
- [ ] **4.4** Resultados en tiempo real — WebSockets: el profesional ve resultados al instante.
- [ ] **4.5** Control de tutor — Un familiar puede supervisar y asistir al paciente.

---

### FASE 5 — App Móvil (Semanas 33–40)

- [ ] **5.1** App React Native — Login, lista de sesiones, reproductor de ejercicios, resultados.
- [ ] **5.2** Modo offline — Caché de sesiones. Sync de resultados al recuperar conexión.
- [ ] **5.3** Publicación en stores — App Store y Google Play.

---

### FASE 6 — Open Source (Semanas 41–44)

- [ ] **6.1** Documentación técnica completa — Instalación, arquitectura, contribución.
- [ ] **6.2** Sistema de contribución de ejercicios — Profesionales proponen ejercicios con revisión.
- [ ] **6.3** API pública documentada — OpenAPI para integraciones externas.
- [ ] **6.4** Web pública del proyecto — Landing page, documentación, comunidad.

---

## Cómo trabajar con este archivo

1. Marca cada tarea como `[x]` al completarla.
2. Trabaja **una tarea a la vez**. Haz commit antes de empezar la siguiente.
3. Para cada ejercicio de la Fase 2, lee su descripción completa antes de implementarlo.
4. Ante cualquier duda de arquitectura, consulta este archivo antes de improvisar.
5. Si añades modelos, ejercicios o convenciones, actualiza este archivo.