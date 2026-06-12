import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession, useStartSession } from '../../hooks/useSessions';
import { api } from '../../lib/api';
import { CancellationPlayer } from './exercises/CancellationPlayer';
import { VisualSearchPlayer } from './exercises/VisualSearchPlayer';
import { GoNoGoPlayer } from './exercises/GoNoGoPlayer';
import { DividedAttentionPlayer } from './exercises/DividedAttentionPlayer';
import { AlternatingAttentionPlayer } from './exercises/AlternatingAttentionPlayer';
import { AttentionSpanPlayer } from './exercises/AttentionSpanPlayer';
import { ReactionTimePlayer } from './exercises/ReactionTimePlayer';
import { VigilancePlayer } from './exercises/VigilancePlayer';
import { AuditoryAttentionPlayer } from './exercises/AuditoryAttentionPlayer';
import { VisualTrackingPlayer } from './exercises/VisualTrackingPlayer';
import { DigitSpanPlayer } from './exercises/DigitSpanPlayer';
import { ImagePairsPlayer } from './exercises/ImagePairsPlayer';
import { PositionSequencesPlayer } from './exercises/PositionSequencesPlayer';
import { FaceMemoryPlayer } from './exercises/FaceMemoryPlayer';
import { WordMemoryPlayer } from './exercises/WordMemoryPlayer';
import { StoryMemoryPlayer } from './exercises/StoryMemoryPlayer';
import { ProspectiveMemoryPlayer } from './exercises/ProspectiveMemoryPlayer';
import { SemanticMemoryPlayer } from './exercises/SemanticMemoryPlayer';
import { VisualRecognitionPlayer } from './exercises/VisualRecognitionPlayer';
import { SpatialWorkingMemoryPlayer } from './exercises/SpatialWorkingMemoryPlayer';
import { EpisodicMemoryPlayer } from './exercises/EpisodicMemoryPlayer';
import { VisuospatialSpanPlayer } from './exercises/VisuospatialSpanPlayer';
import { StroopPlayer } from './exercises/StroopPlayer';
import { TrailMakingPlayer } from './exercises/TrailMakingPlayer';
import { TowerOfHanoiPlayer } from './exercises/TowerOfHanoiPlayer';
import { RoutePlanningPlayer } from './exercises/RoutePlanningPlayer';
import { InhibitionPlayer } from './exercises/InhibitionPlayer';
import { CognitiveFlexibilityPlayer } from './exercises/CognitiveFlexibilityPlayer';
import { AbstractReasoningPlayer } from './exercises/AbstractReasoningPlayer';
import { CategorizationPlayer } from './exercises/CategorizationPlayer';
import { ProblemSolvingPlayer } from './exercises/ProblemSolvingPlayer';
import { DesignFluencyPlayer } from './exercises/DesignFluencyPlayer';
import { NBackPlayer } from './exercises/NBackPlayer';
import { DualTaskPlayer } from './exercises/DualTaskPlayer';
import { PhonologicalFluencyPlayer } from './exercises/PhonologicalFluencyPlayer';
import { SemanticFluencyPlayer } from './exercises/SemanticFluencyPlayer';
import { NamingPlayer } from './exercises/NamingPlayer';
import { ComprehensionPlayer } from './exercises/ComprehensionPlayer';
import { RepetitionPlayer } from './exercises/RepetitionPlayer';
import { ReadingPlayer } from './exercises/ReadingPlayer';
import { WritingPlayer } from './exercises/WritingPlayer';
import { ProsodyPlayer } from './exercises/ProsodyPlayer';
import { MentalRotationPlayer } from './exercises/MentalRotationPlayer';
import { FigureCopyPlayer } from './exercises/FigureCopyPlayer';
import { PuzzlePlayer } from './exercises/PuzzlePlayer';
import { MazePlayer } from './exercises/MazePlayer';
import { DepthPerceptionPlayer } from './exercises/DepthPerceptionPlayer';
import { ObjectAssemblyPlayer } from './exercises/ObjectAssemblyPlayer';
import { ShapeDiscriminationPlayer } from './exercises/ShapeDiscriminationPlayer';
import { LineOrientationPlayer } from './exercises/LineOrientationPlayer';

const AREA_LABELS: Record<string, string> = {
  ATTENTION: 'Atención',
  MEMORY: 'Memoria',
  EXECUTIVE_FUNCTIONS: 'Func. Ejecutivas',
  LANGUAGE: 'Lenguaje',
  VISUOSPATIAL: 'Visoespacial',
  ORIENTATION: 'Orientación',
  SOCIAL_COGNITION: 'Cog. Social',
};

function useTimer(active: boolean) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  const reset = useCallback(() => setElapsed(0), []);
  return { elapsed, reset };
}

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

type Phase = 'intro' | 'playing' | 'feedback' | 'done';

interface ExerciseResult {
  hits: number;
  errors: number;
  reactionTimeMs: number | null;
  rawData?: Record<string, unknown>;
}

export function SessionPlayerPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const { data: session, isLoading } = useSession(id);
  const startSession = useStartSession();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [lastResult, setLastResult] = useState<ExerciseResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);

  const { elapsed, reset: resetTimer } = useTimer(phase === 'playing');

  const currentItem = session?.items[currentIndex];

  const handleStart = async () => {
    if (!session || started) return;
    setStarted(true);
    try {
      await startSession.mutateAsync(session.id);
    } catch {
      // may already be in_progress
    }
    setPhase('intro');
  };

  const beginExercise = () => {
    resetTimer();
    setPhase('playing');
  };

  const submitResult = async (result: ExerciseResult) => {
    if (!currentItem) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/results', {
        sessionItemId: currentItem.id,
        hits: result.hits,
        errors: result.errors,
        ...(result.reactionTimeMs !== null && { reactionTimeMs: result.reactionTimeMs }),
        ...(result.rawData && { rawData: result.rawData }),
      });
      setLastResult(result);
      setPhase('feedback');
    } catch {
      setError('Error al guardar el resultado');
    } finally {
      setSubmitting(false);
    }
  };

  const nextExercise = () => {
    if (!session) return;
    if (currentIndex + 1 >= session.items.length) {
      navigate(`/sesiones/${session.id}/resumen`);
    } else {
      setCurrentIndex((i) => i + 1);
      setLastResult(null);
      setPhase('intro');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <p className="py-16 text-center text-gray-400">Sesión no encontrada.</p>;
  }

  if (session.status === 'COMPLETED') {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold text-gray-700">Esta sesión ya está completada.</p>
        <button
          onClick={() => navigate(`/sesiones/${session.id}/resumen`)}
          className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Ver resumen
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Progress bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-sm text-gray-500">
          <span>
            Ejercicio {Math.min(currentIndex + 1, session.items.length)} de {session.items.length}
          </span>
          {phase === 'playing' && (
            <span className="font-mono text-indigo-600">{formatTime(elapsed)}</span>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-indigo-600 transition-all"
            style={{ width: `${((currentIndex) / session.items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Start gate */}
      {!started && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Sesión lista</h1>
          <p className="mt-2 text-gray-500">
            {session.items.length} ejercicio{session.items.length !== 1 ? 's' : ''} programado{session.items.length !== 1 ? 's' : ''}.
          </p>
          <button
            onClick={handleStart}
            className="mt-6 rounded-lg bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Comenzar sesión
          </button>
        </div>
      )}

      {/* Exercise intro */}
      {started && phase === 'intro' && currentItem && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
            {AREA_LABELS[currentItem.exercise.cognitiveArea] ?? currentItem.exercise.cognitiveArea}
          </span>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">{currentItem.exercise.title}</h2>
          <p className="mt-2 text-sm text-gray-500">Nivel {currentItem.level} · Ejercicio {currentIndex + 1} de {session.items.length}</p>
          <button
            onClick={beginExercise}
            className="mt-6 rounded-lg bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Empezar ejercicio
          </button>
        </div>
      )}

      {/* Exercise player */}
      {started && phase === 'playing' && currentItem && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          {currentItem.exercise.slug === 'cancellation' ? (
            <CancellationPlayer
              level={currentItem.level}
              seed={Date.now()}
              elapsedMs={elapsed * 1000}
              onComplete={(result) => { void submitResult(result); }}
            />
          ) : currentItem.exercise.slug === 'visual-search' ? (
            <VisualSearchPlayer
              level={currentItem.level}
              seed={Date.now()}
              elapsedMs={elapsed * 1000}
              onComplete={(result) => { void submitResult(result); }}
            />
          ) : currentItem.exercise.slug === 'go-no-go' ? (
            <GoNoGoPlayer
              level={currentItem.level}
              seed={Date.now()}
              onComplete={(result) => { void submitResult(result); }}
            />
          ) : currentItem.exercise.slug === 'divided-attention' ? (
            <DividedAttentionPlayer
              level={currentItem.level}
              seed={Date.now()}
              onComplete={(result) => { void submitResult(result); }}
            />
          ) : currentItem.exercise.slug === 'alternating-attention' ? (
            <AlternatingAttentionPlayer
              level={currentItem.level}
              seed={Date.now()}
              onComplete={(result) => { void submitResult(result); }}
            />
          ) : currentItem.exercise.slug === 'attention-span' ? (
            <AttentionSpanPlayer
              level={currentItem.level}
              seed={Date.now()}
              onComplete={(result) => { void submitResult(result); }}
            />
          ) : currentItem.exercise.slug === 'reaction-time' ? (
            <ReactionTimePlayer
              level={currentItem.level}
              seed={Date.now()}
              onComplete={(result) => { void submitResult(result); }}
            />
          ) : currentItem.exercise.slug === 'vigilance' ? (
            <VigilancePlayer
              level={currentItem.level}
              seed={Date.now()}
              onComplete={(result) => { void submitResult(result); }}
            />
          ) : currentItem.exercise.slug === 'auditory-attention' ? (
            <AuditoryAttentionPlayer
              level={currentItem.level}
              seed={Date.now()}
              onComplete={(result) => { void submitResult(result); }}
            />
          ) : currentItem.exercise.slug === 'visual-tracking' ? (
            <VisualTrackingPlayer
              level={currentItem.level}
              seed={Date.now()}
              onComplete={(result) => { void submitResult(result); }}
            />
          ) : currentItem.exercise.slug === 'digit-span' ? (
            <DigitSpanPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'image-pairs' ? (
            <ImagePairsPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'position-sequences' ? (
            <PositionSequencesPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'face-memory' ? (
            <FaceMemoryPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'word-memory' ? (
            <WordMemoryPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'story-memory' ? (
            <StoryMemoryPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'prospective-memory' ? (
            <ProspectiveMemoryPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'semantic-memory' ? (
            <SemanticMemoryPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'visual-recognition' ? (
            <VisualRecognitionPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'spatial-working-memory' ? (
            <SpatialWorkingMemoryPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'episodic-memory' ? (
            <EpisodicMemoryPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'visuospatial-span' ? (
            <VisuospatialSpanPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'stroop' ? (
            <StroopPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'trail-making' ? (
            <TrailMakingPlayer level={currentItem.level} seed={Date.now()} elapsedMs={elapsed * 1000} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'tower-of-hanoi' ? (
            <TowerOfHanoiPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'route-planning' ? (
            <RoutePlanningPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'inhibition' ? (
            <InhibitionPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'cognitive-flexibility' ? (
            <CognitiveFlexibilityPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'abstract-reasoning' ? (
            <AbstractReasoningPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'categorization' ? (
            <CategorizationPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'problem-solving' ? (
            <ProblemSolvingPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'design-fluency' ? (
            <DesignFluencyPlayer level={currentItem.level} seed={Date.now()} elapsedMs={elapsed * 1000} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'n-back' ? (
            <NBackPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'dual-task' ? (
            <DualTaskPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'phonological-fluency' ? (
            <PhonologicalFluencyPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'semantic-fluency' ? (
            <SemanticFluencyPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'naming' ? (
            <NamingPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'comprehension' ? (
            <ComprehensionPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'repetition' ? (
            <RepetitionPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'reading' ? (
            <ReadingPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'writing' ? (
            <WritingPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'prosody' ? (
            <ProsodyPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'mental-rotation' ? (
            <MentalRotationPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'figure-copy' ? (
            <FigureCopyPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'puzzle' ? (
            <PuzzlePlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'maze' ? (
            <MazePlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'depth-perception' ? (
            <DepthPerceptionPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'object-assembly' ? (
            <ObjectAssemblyPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'shape-discrimination' ? (
            <ShapeDiscriminationPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : currentItem.exercise.slug === 'line-orientation' ? (
            <LineOrientationPlayer level={currentItem.level} seed={Date.now()} onComplete={(r) => { void submitResult(r); }} />
          ) : (
            <ExercisePlaceholder
              exercise={currentItem.exercise}
              level={currentItem.level}
              elapsedMs={elapsed * 1000}
              onComplete={(result) => { void submitResult(result); }}
              submitting={submitting}
            />
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {/* Feedback */}
      {phase === 'feedback' && lastResult && currentItem && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <span className="text-2xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Ejercicio completado</h2>
          <p className="mt-1 text-gray-500">{currentItem.exercise.title}</p>

          <div className="mt-6 flex justify-center gap-8">
            <div>
              <p className="text-3xl font-bold text-green-600">{lastResult.hits}</p>
              <p className="text-xs text-gray-500">Aciertos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-500">{lastResult.errors}</p>
              <p className="text-xs text-gray-500">Errores</p>
            </div>
            {lastResult.reactionTimeMs !== null && (
              <div>
                <p className="text-3xl font-bold text-indigo-600">
                  {(lastResult.reactionTimeMs / 1000).toFixed(1)}s
                </p>
                <p className="text-xs text-gray-500">Tiempo</p>
              </div>
            )}
          </div>

          <button
            onClick={nextExercise}
            className="mt-8 rounded-lg bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700"
          >
            {currentIndex + 1 >= session.items.length ? 'Ver resumen' : 'Siguiente ejercicio →'}
          </button>
        </div>
      )}
    </div>
  );
}

interface PlaceholderProps {
  exercise: { slug: string; title: string; cognitiveArea: string };
  level: number;
  elapsedMs: number;
  onComplete: (r: ExerciseResult) => void;
  submitting: boolean;
}

function ExercisePlaceholder({ exercise, level, elapsedMs, onComplete, submitting }: PlaceholderProps) {
  const [hits, setHits] = useState(0);
  const [errors, setErrors] = useState(0);

  return (
    <div className="text-center">
      <p className="mb-1 text-xs text-gray-400">Vista previa — ejercicio en desarrollo</p>
      <h3 className="text-lg font-semibold text-gray-800">{exercise.title} · Nivel {level}</h3>

      <div className="mt-6 flex justify-center gap-8">
        <div>
          <p className="mb-1 text-sm text-gray-500">Aciertos</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setHits((h) => Math.max(0, h - 1))} className="rounded border px-2">−</button>
            <span className="w-8 text-center text-xl font-bold">{hits}</span>
            <button onClick={() => setHits((h) => h + 1)} className="rounded border px-2">+</button>
          </div>
        </div>
        <div>
          <p className="mb-1 text-sm text-gray-500">Errores</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setErrors((e) => Math.max(0, e - 1))} className="rounded border px-2">−</button>
            <span className="w-8 text-center text-xl font-bold">{errors}</span>
            <button onClick={() => setErrors((e) => e + 1)} className="rounded border px-2">+</button>
          </div>
        </div>
      </div>

      <button
        onClick={() => onComplete({ hits, errors, reactionTimeMs: elapsedMs })}
        disabled={submitting}
        className="mt-8 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? 'Guardando...' : 'Finalizar ejercicio'}
      </button>
    </div>
  );
}
