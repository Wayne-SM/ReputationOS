import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  accentColor?: string;
  disabled?: boolean;
}

export function StarRating({
  value,
  onChange,
  accentColor = '#2563eb',
  disabled = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const activeRating = hovered !== null ? hovered : value;

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= activeRating;

        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => !disabled && setHovered(null)}
            className="p-1 sm:p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform transform active:scale-95 hover:scale-110 disabled:cursor-not-allowed"
            style={{
              // Focus ring matches accent
              ['--tw-ring-color' as any]: accentColor,
            }}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <svg
              className={`w-9 h-9 sm:w-11 sm:h-11 transition-colors duration-150 ${
                isFilled ? '' : 'text-gray-200 hover:text-gray-300'
              }`}
              style={{
                color: isFilled ? accentColor : undefined,
                fill: isFilled ? 'currentColor' : 'none',
              }}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={isFilled ? '0.5' : '1.5'}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
