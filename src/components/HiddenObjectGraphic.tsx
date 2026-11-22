import type { HiddenObjectDef } from '../game/hiddenObjects';

interface HiddenObjectGraphicProps {
  item: Pick<HiddenObjectDef, 'shape' | 'primaryColor' | 'accentColor'>;
  className?: string;
}

const STROKE = '#133C46';

export function HiddenObjectGraphic({ item, className = 'w-12 h-12' }: HiddenObjectGraphicProps) {
  const { shape, primaryColor: p, accentColor: a } = item;

  return (
    <svg
      viewBox="0 0 64 64"
      className={`${className} drop-shadow-[0_4px_6px_rgba(15,41,51,0.28)]`}
      aria-hidden="true"
    >
      {/* Subtle grounded contact shadow */}
      <ellipse cx="32" cy="55.5" rx="16.5" ry="3.6" fill="#0F2933" opacity="0.2" />

      {shape === 'comb' && (
        <g transform="rotate(-18 32 32)">
          <rect x="10" y="19" width="44" height="11" rx="4.5" fill={p} stroke={STROKE} strokeWidth="1.6" />
          {[14, 19, 24, 29, 34, 39, 44, 49].map((x) => (
            <line key={x} x1={x} y1="30" x2={x} y2="45" stroke={p} strokeWidth="2.6" strokeLinecap="round" />
          ))}
          <line x1="14" y1="22.5" x2="50" y2="22.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
          <circle cx="15" cy="24.5" r="2" fill={a} />
        </g>
      )}

      {shape === 'hairbrush' && (
        <g transform="rotate(20 32 32)">
          <ellipse cx="32" cy="23" rx="13" ry="15" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <rect x="29" y="37" width="6" height="17" rx="3" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <ellipse cx="32" cy="23" rx="8.5" ry="10.5" fill={a} />
          <ellipse cx="28" cy="18" rx="3" ry="4" fill="#FFFFFF" opacity="0.45" />
          <circle cx="32" cy="49" r="1.5" fill={a} />
        </g>
      )}

      {shape === 'bow_clip' && (
        <g>
          <path d="M11 21 C11 19, 28 27, 30 32 C28 37, 11 45, 11 43 Z" fill={p} stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M53 21 C53 19, 36 27, 34 32 C36 37, 53 45, 53 43 Z" fill={p} stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M15 26 L26 31 M49 26 L38 31" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
          <rect x="28" y="27" width="8" height="10" rx="4" fill={a} stroke={STROKE} strokeWidth="1.5" />
        </g>
      )}

      {shape === 'headband' && (
        <g>
          <path d="M14 44 C12 15, 52 15, 50 44" fill="none" stroke={p} strokeWidth="6.5" strokeLinecap="round" />
          <path d="M14 44 C12 15, 52 15, 50 44" fill="none" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M20 23 C25 18, 39 18, 44 23" fill="none" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
          <circle cx="32" cy="18" r="4" fill={a} stroke={STROKE} strokeWidth="1.4" />
          <circle cx="24" cy="20" r="2.2" fill="#FFFFFF" stroke={STROKE} strokeWidth="1" />
          <circle cx="40" cy="20" r="2.2" fill="#FFFFFF" stroke={STROKE} strokeWidth="1" />
        </g>
      )}

      {shape === 'curling_wand' && (
        <g transform="rotate(-35 32 32)">
          <rect x="27" y="10" width="10" height="24" rx="4.5" fill={a} stroke={STROKE} strokeWidth="1.6" />
          <line x1="30" y1="13" x2="30" y2="30" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
          <rect x="25" y="34" width="14" height="20" rx="5" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <circle cx="32" cy="41" r="2" fill="#FDE047" />
        </g>
      )}

      {shape === 'necklace' && (
        <g>
          <path d="M15 16 Q32 46 49 16" fill="none" stroke="#D4AF37" strokeWidth="1.8" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const t = i / 6;
            const x = 15 + t * 34;
            const y = 16 + Math.sin(t * Math.PI) * 16;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="3.4" fill={p} stroke={STROKE} strokeWidth="1.2" />
                <circle cx={x - 1} cy={y - 1} r="1" fill="#FFFFFF" opacity="0.8" />
              </g>
            );
          })}
          <path d="M32 33 L38 41.5 L32 50 L26 41.5 Z" fill={a} stroke={STROKE} strokeWidth="1.5" />
          <polygon points="32,35.5 34.5,41 32,43.5 29.5,41" fill="#FFFFFF" opacity="0.6" />
        </g>
      )}

      {shape === 'earrings' && (
        <g>
          {[22, 42].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="20" r="3.6" fill={a} stroke={STROKE} strokeWidth="1.4" />
              <path d={`M${cx} 24 L${cx + 6.5} 36 L${cx} 48 L${cx - 6.5} 36 Z`} fill={p} stroke={STROKE} strokeWidth="1.5" />
              <path d={`M${cx} 27 L${cx + 2.5} 36 L${cx} 41`} fill="none" stroke="#FFFFFF" strokeWidth="1.3" opacity="0.7" />
            </g>
          ))}
        </g>
      )}

      {shape === 'ring' && (
        <g>
          <circle cx="32" cy="37" r="13.5" fill="none" stroke={a} strokeWidth="5.5" />
          <circle cx="32" cy="37" r="13.5" fill="none" stroke={STROKE} strokeWidth="1.5" />
          <polygon points="32,11 40.5,20 32,27.5 23.5,20" fill={p} stroke={STROKE} strokeWidth="1.5" />
          <polygon points="32,14 36,19.5 32,22 28,19.5" fill="#FFFFFF" opacity="0.55" />
        </g>
      )}

      {shape === 'bracelet' && (
        <g>
          <ellipse cx="32" cy="34" rx="18" ry="12" fill="none" stroke={p} strokeWidth="6.5" />
          <ellipse cx="32" cy="34" rx="18" ry="12" fill="none" stroke={STROKE} strokeWidth="1.5" />
          <path d="M18 28 Q32 21 46 28" fill="none" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.55" />
          <circle cx="32" cy="46" r="4.5" fill={a} stroke={STROKE} strokeWidth="1.4" />
          <circle cx="30.8" cy="44.8" r="1.4" fill="#FFFFFF" opacity="0.75" />
        </g>
      )}

      {shape === 'tiara' && (
        <g>
          <path d="M12 44 L16 24 L26 34 L32 15 L38 34 L48 24 L52 44 Z" fill={p} stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="32" cy="29" r="3.5" fill={a} stroke={STROKE} strokeWidth="1" />
          <circle cx="20" cy="37" r="2.4" fill={a} />
          <circle cx="44" cy="37" r="2.4" fill={a} />
          <circle cx="32" cy="15" r="2" fill="#FFFFFF" />
        </g>
      )}

      {shape === 'watch' && (
        <g>
          <rect x="26" y="10" width="12" height="44" rx="3.5" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <circle cx="32" cy="32" r="11" fill={a} stroke={STROKE} strokeWidth="1.6" />
          <circle cx="32" cy="32" r="8.5" fill="#FFFFFF" opacity="0.88" />
          <polyline points="32,26.5 32,32 36.5,35" fill="none" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {shape === 'lipstick' && (
        <g>
          <path d="M27 12 L37 18 L37 28 L27 28 Z" fill={p} stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
          <line x1="29.5" y1="15" x2="29.5" y2="25" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
          <rect x="25" y="28" width="14" height="8" fill={a} stroke={STROKE} strokeWidth="1.5" />
          <rect x="24" y="36" width="16" height="17" rx="2.5" fill="#0F2933" />
          <rect x="27" y="38" width="2.5" height="13" rx="1" fill="#FFFFFF" opacity="0.22" />
        </g>
      )}

      {shape === 'perfume' && (
        <g>
          <rect x="26" y="10" width="12" height="8" rx="2.5" fill={a} stroke={STROKE} strokeWidth="1.5" />
          <rect x="28" y="18" width="8" height="4" fill="#E5B869" stroke={STROKE} strokeWidth="1" />
          <rect x="16" y="22" width="32" height="30" rx="9" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <rect x="22" y="30" width="20" height="13" rx="3" fill="#FFFFFF" opacity="0.9" />
          <line x1="20" y1="26" x2="20" y2="45" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
        </g>
      )}

      {shape === 'palette' && (
        <g>
          <rect x="12" y="16" width="40" height="32" rx="5" fill="#133C46" stroke={STROKE} strokeWidth="1.4" />
          <rect x="15" y="19" width="34" height="26" rx="3" fill="#F4FAFB" />
          <circle cx="23" cy="27" r="4.3" fill={p} />
          <circle cx="34" cy="27" r="4.3" fill={a} />
          <circle cx="43" cy="27" r="4.3" fill="#FDE047" />
          <circle cx="23" cy="38" r="4.3" fill="#38BDF8" />
          <circle cx="34" cy="38" r="4.3" fill="#FB7185" />
          <circle cx="43" cy="38" r="4.3" fill="#D8B4FE" />
        </g>
      )}

      {shape === 'compact' && (
        <g>
          <circle cx="32" cy="32" r="18" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <circle cx="32" cy="32" r="13" fill={a} stroke={STROKE} strokeWidth="1.4" />
          <line x1="24" y1="26" x2="36" y2="38" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          <line x1="29" y1="24" x2="38" y2="33" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
        </g>
      )}

      {shape === 'serum' && (
        <g>
          <rect x="29" y="10" width="6" height="8" rx="2" fill={STROKE} />
          <rect x="24" y="18" width="16" height="6" rx="2" fill={a} stroke={STROKE} strokeWidth="1.4" />
          <rect x="20" y="24" width="24" height="28" rx="7" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <rect x="24" y="29" width="3" height="17" rx="1.5" fill="#FFFFFF" opacity="0.55" />
        </g>
      )}

      {shape === 'nail_polish' && (
        <g>
          <rect x="27" y="10" width="10" height="16" rx="2.5" fill="#0F2933" />
          <path d="M19 26 L45 26 L48 51 L16 51 Z" fill={p} stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
          <rect x="25" y="34" width="14" height="10" rx="2.5" fill={a} />
          <line x1="21" y1="30" x2="19.5" y2="46" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </g>
      )}

      {shape === 'makeup_brush' && (
        <g transform="rotate(25 32 32)">
          <path d="M22 24 C22 10, 42 10, 42 24 Z" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <rect x="26" y="24" width="12" height="6" fill="#E5B869" stroke={STROKE} strokeWidth="1.4" />
          <rect x="29" y="30" width="6" height="24" rx="3" fill={a} stroke={STROKE} strokeWidth="1.5" />
        </g>
      )}

      {shape === 'dress' && (
        <g>
          <path d="M24 10 L40 10 L37 24 L27 24 Z" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <path d="M27 24 L37 24 L50 53 Q32 58 14 53 Z" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <rect x="25" y="22" width="14" height="4" rx="2" fill={a} />
          <path d="M28 29 L22 50 M36 29 L42 50" stroke="#FFFFFF" strokeWidth="1.3" opacity="0.35" strokeLinecap="round" />
        </g>
      )}

      {shape === 'shirt' && (
        <g>
          <path d="M22 14 L42 14 L54 24 L46 32 L42 28 L42 50 L22 50 L22 28 L18 32 L10 24 Z" fill={p} stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="32" cy="31" r="4" fill={a} />
          <line x1="25" y1="18" x2="25" y2="46" stroke="#FFFFFF" strokeWidth="1.4" opacity="0.38" strokeLinecap="round" />
        </g>
      )}

      {shape === 'skirt' && (
        <g>
          <rect x="20" y="16" width="24" height="6" rx="2" fill={a} stroke={STROKE} strokeWidth="1.6" />
          <path d="M20 22 L44 22 L52 48 Q32 52 12 48 Z" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <path d="M26 24 L22 46 M32 24 L32 47 M38 24 L42 46" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.4" />
        </g>
      )}

      {shape === 'jacket' && (
        <g>
          <path d="M20 14 L44 14 L54 32 L46 36 L44 28 L44 50 L20 50 L20 28 L18 36 L10 32 Z" fill={p} stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
          <line x1="32" y1="14" x2="32" y2="50" stroke={a} strokeWidth="2.8" />
        </g>
      )}

      {shape === 'heels' && (
        <g>
          <path d="M12 44 L22 44 L26 30 L42 42 L54 44 L54 50 L36 50 L24 38 L22 50 L18 50 L18 44 Z" fill={p} stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="44" cy="40" r="3" fill={a} />
          <path d="M27 33 L38 41" stroke="#FFFFFF" strokeWidth="1.3" opacity="0.55" strokeLinecap="round" />
        </g>
      )}

      {shape === 'sneakers' && (
        <g>
          <path d="M12 42 L14 26 L26 26 L34 36 L52 38 L52 48 L12 48 Z" fill={p} stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
          <rect x="12" y="44" width="40" height="5" rx="2" fill={a} stroke={STROKE} strokeWidth="1.4" />
          <line x1="25" y1="30" x2="30" y2="30" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="28" y1="34" x2="33" y2="34" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {shape === 'skates' && (
        <g>
          <path d="M16 18 L34 18 L38 34 L50 36 L50 44 L16 44 Z" fill={p} stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="22" cy="49" r="5" fill={a} stroke={STROKE} strokeWidth="1.6" />
          <circle cx="44" cy="49" r="5" fill={a} stroke={STROKE} strokeWidth="1.6" />
        </g>
      )}

      {shape === 'handbag' && (
        <g>
          <path d="M22 24 C22 14, 42 14, 42 24" fill="none" stroke={STROKE} strokeWidth="2.6" strokeLinecap="round" />
          <rect x="14" y="24" width="36" height="26" rx="5.5" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <path d="M14 33 L50 33" stroke={a} strokeWidth="2.2" />
          <circle cx="32" cy="33" r="3" fill="#E5B869" stroke={STROKE} strokeWidth="1" />
        </g>
      )}

      {shape === 'clutch' && (
        <g>
          <rect x="12" y="22" width="40" height="24" rx="5" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <path d="M12 28 L32 38 L52 28" fill="none" stroke={a} strokeWidth="2.2" />
          <circle cx="32" cy="38" r="3" fill="#E5B869" />
        </g>
      )}

      {shape === 'sunglasses' && (
        <g>
          <path d="M10 26 L54 26" stroke={STROKE} strokeWidth="2.2" />
          <path d="M12 24 C12 18, 26 18, 28 28 C28 38, 12 40, 12 24 Z" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <path d="M52 24 C52 18, 38 18, 36 28 C36 38, 52 40, 52 24 Z" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <line x1="16" y1="25" x2="22" y2="25" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.65" />
          <line x1="40" y1="25" x2="46" y2="25" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.65" />
        </g>
      )}

      {shape === 'book' && (
        <g>
          <rect x="16" y="12" width="32" height="40" rx="4" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <rect x="16" y="12" width="6" height="40" rx="2" fill="#0F2933" opacity="0.22" />
          <rect x="26" y="20" width="16" height="10" rx="2" fill={a} />
        </g>
      )}

      {shape === 'pen_cup' && (
        <g>
          <line x1="24" y1="12" x2="27" y2="32" stroke={a} strokeWidth="3.8" strokeLinecap="round" />
          <line x1="33" y1="10" x2="33" y2="32" stroke="#F59E0B" strokeWidth="3.8" strokeLinecap="round" />
          <path d="M20 28 L44 28 L41 52 L23 52 Z" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <line x1="24" y1="32" x2="26" y2="48" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.45" strokeLinecap="round" />
        </g>
      )}

      {shape === 'plushie' && (
        <g>
          <ellipse cx="24" cy="18" rx="4" ry="10" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <ellipse cx="40" cy="18" rx="4" ry="10" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <circle cx="32" cy="34" r="15" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <circle cx="27" cy="32" r="2" fill={STROKE} />
          <circle cx="37" cy="32" r="2" fill={STROKE} />
          <circle cx="32" cy="36" r="2.5" fill={a} />
        </g>
      )}

      {shape === 'camera' && (
        <g>
          <rect x="12" y="20" width="40" height="28" rx="6" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <rect x="24" y="14" width="16" height="6" rx="2" fill={a} stroke={STROKE} strokeWidth="1.4" />
          <circle cx="32" cy="34" r="9" fill={a} stroke={STROKE} strokeWidth="1.6" />
          <circle cx="32" cy="34" r="4" fill={STROKE} />
          <circle cx="30" cy="32" r="1.4" fill="#FFFFFF" opacity="0.8" />
        </g>
      )}

      {shape === 'headphones' && (
        <g>
          <path d="M16 34 C16 14, 48 14, 48 34" fill="none" stroke={p} strokeWidth="5" strokeLinecap="round" />
          <rect x="11" y="30" width="9" height="16" rx="4" fill={a} stroke={STROKE} strokeWidth="1.6" />
          <rect x="44" y="30" width="9" height="16" rx="4" fill={a} stroke={STROKE} strokeWidth="1.6" />
        </g>
      )}

      {shape === 'lamp' && (
        <g>
          <path d="M16 30 L48 30 L40 12 L24 12 Z" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <rect x="29" y="30" width="6" height="16" fill="#E5B869" stroke={STROKE} strokeWidth="1.4" />
          <ellipse cx="32" cy="48" rx="12" ry="4" fill={a} stroke={STROKE} strokeWidth="1.6" />
        </g>
      )}

      {shape === 'plant' && (
        <g>
          <path d="M32 30 C24 14, 16 18, 22 30" fill="#10B981" stroke={STROKE} strokeWidth="1.5" />
          <path d="M32 30 C40 14, 48 18, 42 30" fill="#10B981" stroke={STROKE} strokeWidth="1.5" />
          <path d="M32 30 C28 10, 36 10, 32 30" fill="#34D399" stroke={STROKE} strokeWidth="1.4" />
          <path d="M20 30 L44 30 L40 50 L24 50 Z" fill={p} stroke={STROKE} strokeWidth="1.6" />
        </g>
      )}

      {shape === 'pillow' && (
        <g>
          <path d="M32 48 C18 39, 12 30, 12 22 C12 15, 18 12, 24 12 C28 12, 31 15, 32 18 C33 15, 36 12, 40 12 C46 12, 52 15, 52 22 C52 30, 46 39, 32 48 Z" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <circle cx="32" cy="29" r="3.5" fill={a} />
          <path d="M18 20 Q22 16 26 19" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
        </g>
      )}

      {shape === 'teacup' && (
        <g>
          <path d="M44 28 C52 28, 52 40, 44 40" fill="none" stroke={STROKE} strokeWidth="2.5" />
          <path d="M18 24 L46 24 L42 48 L22 48 Z" fill={p} stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
          <ellipse cx="32" cy="50" rx="16" ry="4" fill={a} stroke={STROKE} strokeWidth="1.4" />
        </g>
      )}

      {shape === 'candle' && (
        <g>
          <path d="M32 10 Q36 16 32 20 Q28 16 32 10 Z" fill="#FBBF24" />
          <rect x="20" y="22" width="24" height="28" rx="4.5" fill={p} stroke={STROKE} strokeWidth="1.6" />
          <rect x="24" y="30" width="16" height="10" rx="2" fill={a} />
          <line x1="23" y1="26" x2="23" y2="45" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.55" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
