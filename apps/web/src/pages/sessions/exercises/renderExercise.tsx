import { CancellationPlayer } from './CancellationPlayer';
import { VisualSearchPlayer } from './VisualSearchPlayer';
import { GoNoGoPlayer } from './GoNoGoPlayer';
import { DividedAttentionPlayer } from './DividedAttentionPlayer';
import { AlternatingAttentionPlayer } from './AlternatingAttentionPlayer';
import { AttentionSpanPlayer } from './AttentionSpanPlayer';
import { ReactionTimePlayer } from './ReactionTimePlayer';
import { VigilancePlayer } from './VigilancePlayer';
import { AuditoryAttentionPlayer } from './AuditoryAttentionPlayer';
import { VisualTrackingPlayer } from './VisualTrackingPlayer';
import { DigitSpanPlayer } from './DigitSpanPlayer';
import { ImagePairsPlayer } from './ImagePairsPlayer';
import { PositionSequencesPlayer } from './PositionSequencesPlayer';
import { FaceMemoryPlayer } from './FaceMemoryPlayer';
import { WordMemoryPlayer } from './WordMemoryPlayer';
import { StoryMemoryPlayer } from './StoryMemoryPlayer';
import { ProspectiveMemoryPlayer } from './ProspectiveMemoryPlayer';
import { SemanticMemoryPlayer } from './SemanticMemoryPlayer';
import { VisualRecognitionPlayer } from './VisualRecognitionPlayer';
import { SpatialWorkingMemoryPlayer } from './SpatialWorkingMemoryPlayer';
import { EpisodicMemoryPlayer } from './EpisodicMemoryPlayer';
import { VisuospatialSpanPlayer } from './VisuospatialSpanPlayer';
import { StroopPlayer } from './StroopPlayer';
import { TrailMakingPlayer } from './TrailMakingPlayer';
import { TowerOfHanoiPlayer } from './TowerOfHanoiPlayer';
import { RoutePlanningPlayer } from './RoutePlanningPlayer';
import { InhibitionPlayer } from './InhibitionPlayer';
import { CognitiveFlexibilityPlayer } from './CognitiveFlexibilityPlayer';
import { AbstractReasoningPlayer } from './AbstractReasoningPlayer';
import { CategorizationPlayer } from './CategorizationPlayer';
import { ProblemSolvingPlayer } from './ProblemSolvingPlayer';
import { DesignFluencyPlayer } from './DesignFluencyPlayer';
import { NBackPlayer } from './NBackPlayer';
import { DualTaskPlayer } from './DualTaskPlayer';
import { PhonologicalFluencyPlayer } from './PhonologicalFluencyPlayer';
import { SemanticFluencyPlayer } from './SemanticFluencyPlayer';
import { NamingPlayer } from './NamingPlayer';
import { ComprehensionPlayer } from './ComprehensionPlayer';
import { RepetitionPlayer } from './RepetitionPlayer';
import { ReadingPlayer } from './ReadingPlayer';
import { WritingPlayer } from './WritingPlayer';
import { ProsodyPlayer } from './ProsodyPlayer';
import { MentalRotationPlayer } from './MentalRotationPlayer';
import { FigureCopyPlayer } from './FigureCopyPlayer';
import { PuzzlePlayer } from './PuzzlePlayer';
import { MazePlayer } from './MazePlayer';
import { DepthPerceptionPlayer } from './DepthPerceptionPlayer';
import { ObjectAssemblyPlayer } from './ObjectAssemblyPlayer';
import { ShapeDiscriminationPlayer } from './ShapeDiscriminationPlayer';
import { LineOrientationPlayer } from './LineOrientationPlayer';
import { TemporalOrientationPlayer } from './TemporalOrientationPlayer';
import { SpatialOrientationPlayer } from './SpatialOrientationPlayer';
import { PersonalOrientationPlayer } from './PersonalOrientationPlayer';
import { SituationalOrientationPlayer } from './SituationalOrientationPlayer';
import { EmotionRecognitionPlayer } from './EmotionRecognitionPlayer';
import { TheoryOfMindPlayer } from './TheoryOfMindPlayer';
import { EmpathyPlayer } from './EmpathyPlayer';
import { PerspectiveTakingPlayer } from './PerspectiveTakingPlayer';
import { MoralCognitionPlayer } from './MoralCognitionPlayer';
import { NonverbalCommunicationPlayer } from './NonverbalCommunicationPlayer';

export interface ExerciseResult {
  hits: number;
  errors: number;
  reactionTimeMs: number | null;
  rawData?: Record<string, unknown>;
}

interface RenderProps {
  slug: string;
  level: number;
  elapsed: number;
  onComplete: (r: ExerciseResult) => void;
  submitting: boolean;
}

export function renderExercise({ slug, level, elapsed, onComplete, submitting }: RenderProps) {
  const seed = Date.now();
  const props = { level, seed, onComplete: (r: ExerciseResult) => { void onComplete(r); } };
  const elapsedMs = elapsed * 1000;

  switch (slug) {
    case 'cancellation':        return <CancellationPlayer {...props} elapsedMs={elapsedMs} />;
    case 'visual-search':       return <VisualSearchPlayer {...props} elapsedMs={elapsedMs} />;
    case 'go-no-go':            return <GoNoGoPlayer {...props} />;
    case 'divided-attention':   return <DividedAttentionPlayer {...props} />;
    case 'alternating-attention': return <AlternatingAttentionPlayer {...props} />;
    case 'attention-span':      return <AttentionSpanPlayer {...props} />;
    case 'reaction-time':       return <ReactionTimePlayer {...props} />;
    case 'vigilance':           return <VigilancePlayer {...props} />;
    case 'auditory-attention':  return <AuditoryAttentionPlayer {...props} />;
    case 'visual-tracking':     return <VisualTrackingPlayer {...props} />;
    case 'digit-span':          return <DigitSpanPlayer {...props} />;
    case 'image-pairs':         return <ImagePairsPlayer {...props} />;
    case 'position-sequences':  return <PositionSequencesPlayer {...props} />;
    case 'face-memory':         return <FaceMemoryPlayer {...props} />;
    case 'word-memory':         return <WordMemoryPlayer {...props} />;
    case 'story-memory':        return <StoryMemoryPlayer {...props} />;
    case 'prospective-memory':  return <ProspectiveMemoryPlayer {...props} />;
    case 'semantic-memory':     return <SemanticMemoryPlayer {...props} />;
    case 'visual-recognition':  return <VisualRecognitionPlayer {...props} />;
    case 'spatial-working-memory': return <SpatialWorkingMemoryPlayer {...props} />;
    case 'episodic-memory':     return <EpisodicMemoryPlayer {...props} />;
    case 'visuospatial-span':   return <VisuospatialSpanPlayer {...props} />;
    case 'stroop':              return <StroopPlayer {...props} />;
    case 'trail-making':        return <TrailMakingPlayer {...props} elapsedMs={elapsedMs} />;
    case 'tower-of-hanoi':      return <TowerOfHanoiPlayer {...props} />;
    case 'route-planning':      return <RoutePlanningPlayer {...props} />;
    case 'inhibition':          return <InhibitionPlayer {...props} />;
    case 'cognitive-flexibility': return <CognitiveFlexibilityPlayer {...props} />;
    case 'abstract-reasoning':  return <AbstractReasoningPlayer {...props} />;
    case 'categorization':      return <CategorizationPlayer {...props} />;
    case 'problem-solving':     return <ProblemSolvingPlayer {...props} />;
    case 'design-fluency':      return <DesignFluencyPlayer {...props} elapsedMs={elapsedMs} />;
    case 'n-back':              return <NBackPlayer {...props} />;
    case 'dual-task':           return <DualTaskPlayer {...props} />;
    case 'phonological-fluency': return <PhonologicalFluencyPlayer {...props} />;
    case 'semantic-fluency':    return <SemanticFluencyPlayer {...props} />;
    case 'naming':              return <NamingPlayer {...props} />;
    case 'comprehension':       return <ComprehensionPlayer {...props} />;
    case 'repetition':          return <RepetitionPlayer {...props} />;
    case 'reading':             return <ReadingPlayer {...props} />;
    case 'writing':             return <WritingPlayer {...props} />;
    case 'prosody':             return <ProsodyPlayer {...props} />;
    case 'mental-rotation':     return <MentalRotationPlayer {...props} />;
    case 'figure-copy':         return <FigureCopyPlayer {...props} />;
    case 'puzzle':              return <PuzzlePlayer {...props} />;
    case 'maze':                return <MazePlayer {...props} />;
    case 'depth-perception':    return <DepthPerceptionPlayer {...props} />;
    case 'object-assembly':     return <ObjectAssemblyPlayer {...props} />;
    case 'shape-discrimination': return <ShapeDiscriminationPlayer {...props} />;
    case 'line-orientation':    return <LineOrientationPlayer {...props} />;
    case 'temporal-orientation': return <TemporalOrientationPlayer {...props} />;
    case 'spatial-orientation': return <SpatialOrientationPlayer {...props} />;
    case 'personal-orientation': return <PersonalOrientationPlayer {...props} />;
    case 'situational-orientation': return <SituationalOrientationPlayer {...props} />;
    case 'emotion-recognition': return <EmotionRecognitionPlayer {...props} />;
    case 'theory-of-mind':      return <TheoryOfMindPlayer {...props} />;
    case 'empathy':             return <EmpathyPlayer {...props} />;
    case 'perspective-taking':  return <PerspectiveTakingPlayer {...props} />;
    case 'moral-cognition':     return <MoralCognitionPlayer {...props} />;
    case 'nonverbal-communication': return <NonverbalCommunicationPlayer {...props} />;
    default:
      return <ExercisePlaceholder slug={slug} level={level} elapsedMs={elapsedMs} onComplete={onComplete} submitting={submitting} />;
  }
}

function ExercisePlaceholder({ slug, level, elapsedMs, onComplete, submitting }: {
  slug: string; level: number; elapsedMs: number;
  onComplete: (r: ExerciseResult) => void; submitting: boolean;
}) {
  return (
    <div className="py-12 text-center">
      <p className="text-sm text-gray-400">Ejercicio <code>{slug}</code> · Nivel {level}</p>
      <button
        onClick={() => onComplete({ hits: 0, errors: 0, reactionTimeMs: elapsedMs })}
        disabled={submitting}
        className="mt-6 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? 'Guardando...' : 'Completar'}
      </button>
    </div>
  );
}
