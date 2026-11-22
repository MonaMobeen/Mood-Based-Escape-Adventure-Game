import type { RoomItemDef } from '../game/catalog';

interface RoomItemGraphicProps {
  item: Pick<RoomItemDef, 'iconType' | 'color' | 'accent'>;
  className?: string;
}

const STROKE = '#4A2538';

export function RoomItemGraphic({ item, className = 'w-11 h-11' }: RoomItemGraphicProps) {
  const { iconType, color, accent } = item;

  return (
    <svg
      viewBox="0 0 64 64"
      className={`${className} drop-shadow-[0_4px_5px_rgba(42,16,32,0.22)]`}
      aria-hidden="true"
    >
      <ellipse cx="32" cy="55" rx="15" ry="3.2" fill="#2A1020" opacity="0.14" />

      {iconType === 'dress' && (
        <g>
          <path d="M24 10 L40 10 L37 24 L27 24 Z" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <path d="M27 24 L37 24 L50 53 Q32 58 14 53 Z" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <rect x="25" y="22" width="14" height="4" rx="2" fill={accent} />
          <path d="M28 29 L22 50 M36 29 L42 50" stroke="#FFFFFF" strokeWidth="1.3" opacity="0.4" strokeLinecap="round" />
        </g>
      )}

      {iconType === 'heels' && (
        <g>
          <path d="M12 44 L22 44 L26 30 L42 42 L54 44 L54 50 L36 50 L24 38 L22 50 L18 50 L18 44 Z" fill={color} stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
          <circle cx="44" cy="40" r="3" fill={accent} />
        </g>
      )}

      {iconType === 'handbag' && (
        <g>
          <path d="M22 24 C22 14, 42 14, 42 24" fill="none" stroke={STROKE} strokeWidth="2.6" strokeLinecap="round" />
          <rect x="14" y="24" width="36" height="26" rx="5.5" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <path d="M14 33 L50 33" stroke={accent} strokeWidth="2.2" />
          <circle cx="32" cy="33" r="3.4" fill="#E5B869" stroke={STROKE} strokeWidth="1" />
        </g>
      )}

      {iconType === 'necklace' && (
        <g>
          <path d="M16 18 Q32 46 48 18" fill="none" stroke="#D4AF37" strokeWidth="1.8" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const t = i / 6;
            const x = 16 + t * 32;
            const y = 18 + Math.sin(t * Math.PI) * 16;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="3.8" fill={color} stroke={STROKE} strokeWidth="1.2" />
                <circle cx={x - 1} cy={y - 1} r="1" fill="#FFFFFF" opacity="0.8" />
              </g>
            );
          })}
          <circle cx="32" cy="39" r="5" fill={accent} stroke={STROKE} strokeWidth="1.4" />
        </g>
      )}

      {iconType === 'sunglasses' && (
        <g>
          <path d="M10 26 L54 26" stroke={STROKE} strokeWidth="2.2" />
          <path d="M12 24 C12 18, 26 18, 28 28 C28 38, 12 40, 12 24 Z" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <path d="M52 24 C52 18, 38 18, 36 28 C36 38, 52 40, 52 24 Z" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <path d="M16 26 L22 26" stroke={accent} strokeWidth="2" strokeLinecap="round" />
          <path d="M40 26 L46 26" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {iconType === 'sneakers' && (
        <g>
          <path d="M12 42 L14 26 L26 26 L34 36 L52 38 L52 48 L12 48 Z" fill={color} stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
          <rect x="12" y="44" width="40" height="5" rx="2" fill={accent} stroke={STROKE} strokeWidth="1.4" />
          <line x1="25" y1="30" x2="30" y2="30" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="28" y1="34" x2="33" y2="34" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {iconType === 'perfume' && (
        <g>
          <rect x="26" y="10" width="12" height="8" rx="2.5" fill={accent} stroke={STROKE} strokeWidth="1.5" />
          <rect x="28" y="18" width="8" height="4" fill="#E5B869" />
          <rect x="16" y="22" width="32" height="30" rx="8.5" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <rect x="22" y="30" width="20" height="12" rx="3" fill="#FFFFFF" opacity="0.88" />
          <line x1="20" y1="26" x2="20" y2="45" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.5" strokeLinecap="round" />
        </g>
      )}

      {iconType === 'lipstick' && (
        <g>
          <path d="M27 12 L37 18 L37 28 L27 28 Z" fill={color} stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round" />
          <rect x="25" y="28" width="14" height="8" fill={accent} stroke={STROKE} strokeWidth="1.5" />
          <rect x="24" y="36" width="16" height="17" rx="2.5" fill="#2A1020" />
        </g>
      )}

      {iconType === 'palette' && (
        <g>
          <rect x="12" y="16" width="40" height="32" rx="5" fill="#3B1D2E" />
          <rect x="15" y="19" width="34" height="26" rx="2.5" fill="#FFF7FA" />
          <circle cx="23" cy="27" r="4.3" fill={color} />
          <circle cx="34" cy="27" r="4.3" fill={accent} />
          <circle cx="43" cy="27" r="4.3" fill="#FDE047" />
          <circle cx="23" cy="38" r="4.3" fill="#38BDF8" />
          <circle cx="34" cy="38" r="4.3" fill="#FB7185" />
        </g>
      )}

      {iconType === 'serum' && (
        <g>
          <path d="M29 10 L35 10 L35 18 L29 18 Z" fill={STROKE} />
          <rect x="24" y="18" width="16" height="6" rx="2" fill={accent} stroke={STROKE} strokeWidth="1.4" />
          <rect x="20" y="24" width="24" height="28" rx="6.5" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <circle cx="32" cy="38" r="5" fill="#FFFFFF" opacity="0.82" />
        </g>
      )}

      {iconType === 'brush' && (
        <g>
          <ellipse cx="32" cy="24" rx="13" ry="15" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <rect x="29" y="38" width="6" height="16" rx="3" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <ellipse cx="32" cy="24" rx="8" ry="10" fill={accent} />
        </g>
      )}

      {iconType === 'mirror' && (
        <g>
          <circle cx="32" cy="32" r="18" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <circle cx="32" cy="32" r="13" fill={accent} stroke={STROKE} strokeWidth="1.4" />
          <line x1="25" y1="26" x2="36" y2="37" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}

      {iconType === 'journal' && (
        <g>
          <rect x="16" y="12" width="32" height="40" rx="4" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <rect x="16" y="12" width="7" height="40" rx="2" fill="#2A1020" opacity="0.18" />
          <rect x="26" y="20" width="16" height="10" rx="2" fill={accent} />
        </g>
      )}

      {iconType === 'pens' && (
        <g>
          <line x1="24" y1="12" x2="27" y2="32" stroke={accent} strokeWidth="3.8" strokeLinecap="round" />
          <line x1="33" y1="10" x2="33" y2="32" stroke="#F59E0B" strokeWidth="3.8" strokeLinecap="round" />
          <line x1="41" y1="14" x2="38" y2="32" stroke="#E0218A" strokeWidth="3.8" strokeLinecap="round" />
          <path d="M20 28 L44 28 L41 52 L23 52 Z" fill={color} stroke={STROKE} strokeWidth="1.6" />
        </g>
      )}

      {iconType === 'plushie' && (
        <g>
          <ellipse cx="24" cy="18" rx="4" ry="10" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <ellipse cx="40" cy="18" rx="4" ry="10" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <circle cx="32" cy="34" r="15" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <circle cx="27" cy="32" r="2" fill={STROKE} />
          <circle cx="37" cy="32" r="2" fill={STROKE} />
          <circle cx="32" cy="36" r="2.5" fill={accent} />
        </g>
      )}

      {iconType === 'jewelry_box' && (
        <g>
          <path d="M14 26 L50 26 L46 16 L18 16 Z" fill={accent} stroke={STROKE} strokeWidth="1.6" />
          <rect x="14" y="26" width="36" height="24" rx="3" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <circle cx="32" cy="34" r="3.5" fill="#FFFBEB" stroke={STROKE} strokeWidth="1.4" />
        </g>
      )}

      {iconType === 'lamp' && (
        <g>
          <path d="M16 30 L48 30 L40 12 L24 12 Z" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <rect x="29" y="30" width="6" height="16" fill="#E5B869" stroke={STROKE} strokeWidth="1.4" />
          <ellipse cx="32" cy="48" rx="12" ry="4" fill={accent} stroke={STROKE} strokeWidth="1.6" />
        </g>
      )}

      {iconType === 'plant' && (
        <g>
          <path d="M32 30 C24 14, 16 18, 22 30" fill={color} stroke={STROKE} strokeWidth="1.5" />
          <path d="M32 30 C40 14, 48 18, 42 30" fill={color} stroke={STROKE} strokeWidth="1.5" />
          <path d="M32 30 C28 10, 36 10, 32 30" fill={color} stroke={STROKE} strokeWidth="1.5" />
          <path d="M20 30 L44 30 L40 50 L24 50 Z" fill={accent} stroke={STROKE} strokeWidth="1.6" />
        </g>
      )}

      {iconType === 'cushion' && (
        <g>
          <path d="M32 48 C18 39, 12 30, 12 22 C12 15, 18 12, 24 12 C28 12, 31 15, 32 18 C33 15, 36 12, 40 12 C46 12, 52 15, 52 22 C52 30, 46 39, 32 48 Z" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <circle cx="32" cy="29" r="3.5" fill={accent} />
        </g>
      )}

      {iconType === 'frame' && (
        <g>
          <rect x="14" y="14" width="36" height="36" rx="4" fill={color} stroke={STROKE} strokeWidth="1.6" />
          <rect x="20" y="20" width="24" height="24" fill={accent} stroke={STROKE} strokeWidth="1.4" />
          <circle cx="28" cy="28" r="3" fill="#FBBF24" />
          <path d="M20 40 L29 31 L36 37 L44 32 L44 44 L20 44 Z" fill="#00B4D8" />
        </g>
      )}
    </svg>
  );
}
