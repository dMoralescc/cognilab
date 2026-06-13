import { useState, useMemo } from 'react';
import { useExercises, type Exercise } from '../hooks/useSessions';
import { useFavorites, useToggleFavorite } from '../hooks/useFavorites';
import { QuickPlayModal } from './exercises/QuickPlayModal';

const AREA_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  ATTENTION:           { label: 'Atención',         color: '#6366f1', bg: '#eef2ff', icon: '👁' },
  MEMORY:              { label: 'Memoria',           color: '#0ea5e9', bg: '#f0f9ff', icon: '🧠' },
  EXECUTIVE_FUNCTIONS: { label: 'Func. Ejecutivas', color: '#8b5cf6', bg: '#f5f3ff', icon: '⚙️' },
  LANGUAGE:            { label: 'Lenguaje',          color: '#10b981', bg: '#f0fdf4', icon: '💬' },
  VISUOSPATIAL:        { label: 'Visoespacial',      color: '#f59e0b', bg: '#fffbeb', icon: '🔷' },
  ORIENTATION:         { label: 'Orientación',       color: '#ef4444', bg: '#fef2f2', icon: '🧭' },
  SOCIAL_COGNITION:    { label: 'Cog. Social',      color: '#ec4899', bg: '#fdf2f8', icon: '🤝' },
};

const AREAS = Object.keys(AREA_META);

function HeartButton({ isFavorite, onClick }: { isFavorite: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      className={`flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95 ${
        isFavorite
          ? 'text-rose-500 hover:text-rose-600'
          : 'text-gray-300 hover:text-rose-400'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
}

function ExerciseCard({
  ex,
  isFavorite,
  onPlay,
  onToggleFavorite,
}: {
  ex: Exercise;
  isFavorite: boolean;
  onPlay: (ex: Exercise) => void;
  onToggleFavorite: (exerciseId: string) => void;
}) {
  const meta = AREA_META[ex.cognitiveArea];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md hover:border-indigo-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: meta?.bg, color: meta?.color }}
            >
              {meta?.icon} {meta?.label}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">{ex.title}</h3>
          <p className={`mt-1 text-xs text-gray-500 ${expanded ? '' : 'line-clamp-2'}`}>{ex.description}</p>
          {ex.description && ex.description.length > 90 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-0.5 text-xs text-indigo-500 hover:text-indigo-700"
            >
              {expanded ? 'Mostrar menos' : 'Mostrar más'}
            </button>
          )}
        </div>
        <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
          <HeartButton
            isFavorite={isFavorite}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(ex.id); }}
          />
          <div className="flex gap-0.5 justify-end">
            {Array.from({ length: ex.maxLevel }, (_, i) => (
              <div
                key={i}
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: i < ex.minLevel ? 'transparent' : meta?.color, border: `1px solid ${meta?.color}`, opacity: 0.9 }}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400">Nv. {ex.minLevel}–{ex.maxLevel}</p>
          <button
            onClick={() => onPlay(ex)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 opacity-0 group-hover:opacity-100"
          >
            ▶ Jugar
          </button>
        </div>
      </div>
    </div>
  );
}

const FAVORITES_KEY = 'FAVORITES';

export function ExercisesPage() {
  const [query, setQuery] = useState('');
  const [filterArea, setFilterArea] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [playingExercise, setPlayingExercise] = useState<Exercise | null>(null);

  const { data: exercises = [], isLoading } = useExercises();
  const { data: favoriteIds = [] } = useFavorites();
  const { mutate: toggleFavorite } = useToggleFavorite();

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const showingFavorites = filterArea === FAVORITES_KEY;

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return exercises.filter((ex: Exercise) => {
      if (showingFavorites && !favoriteSet.has(ex.id)) return false;
      if (!showingFavorites && filterArea && ex.cognitiveArea !== filterArea) return false;
      if (filterLevel !== null && (ex.minLevel > filterLevel || ex.maxLevel < filterLevel)) return false;
      if (q && !ex.title.toLowerCase().includes(q) && !ex.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [exercises, query, filterArea, filterLevel, showingFavorites, favoriteSet]);

  const byArea = useMemo(() => {
    const map: Record<string, Exercise[]> = {};
    for (const ex of filtered) {
      if (!map[ex.cognitiveArea]) map[ex.cognitiveArea] = [];
      map[ex.cognitiveArea]!.push(ex);
    }
    return map;
  }, [filtered]);

  const activeMeta = !showingFavorites && filterArea ? AREA_META[filterArea] : null;

  const cardProps = (ex: Exercise) => ({
    ex,
    isFavorite: favoriteSet.has(ex.id),
    onPlay: setPlayingExercise,
    onToggleFavorite: toggleFavorite,
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Biblioteca de ejercicios</h1>
        <p className="text-sm text-gray-500">
          {exercises.length} ejercicios en {AREAS.length} áreas cognitivas
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Buscar ejercicio…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >✕</button>
          )}
        </div>

        {/* Level filter */}
        <select
          value={filterLevel ?? ''}
          onChange={(e) => setFilterLevel(e.target.value ? Number(e.target.value) : null)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
        >
          <option value="">Todos los niveles</option>
          {[1, 2, 3, 4, 5].map((l) => (
            <option key={l} value={l}>Nivel {l}</option>
          ))}
        </select>
      </div>

      {/* Area tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterArea('')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            !filterArea ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todas las áreas
        </button>

        {/* Favorites tab */}
        <button
          onClick={() => setFilterArea(filterArea === FAVORITES_KEY ? '' : FAVORITES_KEY)}
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            showingFavorites
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill={showingFavorites ? 'white' : 'currentColor'} stroke="none">
            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          Favoritos
          {favoriteIds.length > 0 && (
            <span className={`rounded-full px-1.5 text-[10px] font-bold ${showingFavorites ? 'bg-white/30 text-white' : 'bg-rose-100 text-rose-600'}`}>
              {favoriteIds.length}
            </span>
          )}
        </button>

        {AREAS.map((area) => {
          const meta = AREA_META[area]!;
          const count = exercises.filter((e: Exercise) => e.cognitiveArea === area).length;
          return (
            <button
              key={area}
              onClick={() => setFilterArea(filterArea === area ? '' : area)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                filterArea === area
                  ? 'shadow-sm text-white'
                  : 'text-gray-600 hover:opacity-80'
              }`}
              style={
                filterArea === area
                  ? { backgroundColor: meta.color }
                  : { backgroundColor: meta.bg, color: meta.color }
              }
            >
              {meta.icon} {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : showingFavorites && favoriteIds.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-3xl mb-3">🤍</p>
          <p className="font-medium text-gray-700">Aún no tienes favoritos</p>
          <p className="mt-1 text-sm text-gray-400">Toca el corazón en cualquier ejercicio para añadirlo aquí.</p>
          <button
            onClick={() => setFilterArea('')}
            className="mt-4 text-sm text-indigo-600 hover:underline"
          >
            Ver todos los ejercicios
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-400 text-sm">No se encontraron ejercicios con esos filtros.</p>
          <button
            onClick={() => { setQuery(''); setFilterArea(''); setFilterLevel(null); }}
            className="mt-3 text-sm text-indigo-600 hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : showingFavorites ? (
        /* Favorites view — grouped by area */
        <div className="space-y-8">
          {AREAS.filter((area) => byArea[area]?.length).map((area) => {
            const meta = AREA_META[area]!;
            const list = byArea[area]!;
            return (
              <div key={area}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">{meta.icon}</span>
                  <h2 className="font-semibold text-gray-900">{meta.label}</h2>
                  <span className="text-sm text-gray-400">— {list.length} favorito{list.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {list.map((ex) => <ExerciseCard key={ex.id} {...cardProps(ex)} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : filterArea ? (
        /* Single area view — flat grid */
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xl">{activeMeta?.icon}</span>
            <h2 className="font-semibold text-gray-900">{activeMeta?.label}</h2>
            <span className="text-sm text-gray-400">— {filtered.length} ejercicios</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((ex) => <ExerciseCard key={ex.id} {...cardProps(ex)} />)}
          </div>
        </div>
      ) : (
        /* All areas — grouped */
        <div className="space-y-8">
          {AREAS.filter((area) => byArea[area]?.length).map((area) => {
            const meta = AREA_META[area]!;
            const list = byArea[area]!;
            return (
              <div key={area}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.icon}</span>
                    <h2 className="font-semibold text-gray-900">{meta.label}</h2>
                    <span className="text-sm text-gray-400">— {list.length} ejercicios</span>
                  </div>
                  <button
                    onClick={() => setFilterArea(area)}
                    className="text-xs font-medium hover:underline"
                    style={{ color: meta.color }}
                  >
                    Ver solo esta área →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {list.map((ex) => <ExerciseCard key={ex.id} {...cardProps(ex)} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {playingExercise && (
        <QuickPlayModal
          exercise={playingExercise}
          onClose={() => setPlayingExercise(null)}
        />
      )}
    </div>
  );
}
