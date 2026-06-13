interface Props {
  shape: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function ShapeIcon({ shape, size = 32, color = '#374151', strokeWidth = 2.5 }: Props) {
  const s = size;
  const sw = strokeWidth;
  const common = { fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (shape) {
    case '★': // estrella 5 puntas
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <polygon points="16,3 19.6,12.2 29.5,12.2 21.9,18 24.7,27.5 16,22 7.3,27.5 10.1,18 2.5,12.2 12.4,12.2" {...common} />
        </svg>
      );
    case '○': // círculo
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="11" {...common} />
        </svg>
      );
    case '□': // cuadrado
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <rect x="5" y="5" width="22" height="22" rx="2" {...common} />
        </svg>
      );
    case '△': // triángulo
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <polygon points="16,4 29,28 3,28" {...common} />
        </svg>
      );
    case '♦': // rombo
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <polygon points="16,3 29,16 16,29 3,16" {...common} />
        </svg>
      );
    case '✦': // estrella 4 puntas
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <polygon points="16,3 18.5,13.5 29,16 18.5,18.5 16,29 13.5,18.5 3,16 13.5,13.5" {...common} />
        </svg>
      );
    case '⬡': // hexágono
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <polygon points="16,3 27,9.5 27,22.5 16,29 5,22.5 5,9.5" {...common} />
        </svg>
      );
    case '◉': // cruz / más
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <line x1="16" y1="4" x2="16" y2="28" {...common} />
          <line x1="4" y1="16" x2="28" y2="16" {...common} />
        </svg>
      );
    case 'heart': // corazón
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <path d="M16 27 C16 27 4 19 4 11 A6 6 0 0 1 16 9 A6 6 0 0 1 28 11 C28 19 16 27 16 27Z" {...common} />
        </svg>
      );
    case 'moon': // luna
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <path d="M22 16 A10 10 0 1 1 16 6 A7 7 0 0 0 22 16Z" {...common} />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="11" {...common} />
        </svg>
      );
  }
}
