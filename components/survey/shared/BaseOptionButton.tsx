import React from 'react';
import { SurveyOption } from '@/types/survey';

export interface BaseOptionButtonProps {
  option: SurveyOption;
  isSelected: boolean;
  onSelect: (value: string) => void;
  role?: 'radio' | 'option';
  disabled?: boolean;
  'aria-checked'?: boolean;
  'aria-selected'?: boolean;
  className?: string;
}

const BaseOptionButton: React.FC<BaseOptionButtonProps> = ({
  option,
  isSelected,
  onSelect,
  role = 'radio',
  disabled = false,
  className = '',
  ...ariaProps
}) => {
  const baseClasses = `
    w-full text-left rounded-lg border px-4 py-3 transition
    ${isSelected
      ? 'border-[var(--brand-puce)] ring-2 ring-[var(--brand-puce)] bg-[var(--brand-puce)]/10'
      : 'border-gray-300 hover:border-gray-400'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  return (
    <button
      key={option.value}
      type="button"
      role={role}
      onClick={() => onSelect(option.value)}
      disabled={disabled}
      className={`${baseClasses} ${className}`.trim()}
      {...ariaProps}
    >
      <div className="flex items-center gap-3">
        <span
          className={`
            inline-block h-4 w-4 rounded-full border-2
            ${isSelected
              ? 'bg-[var(--brand-puce)] border-[var(--brand-puce)]'
              : 'border-gray-400'
            }
          `}
        >
          {isSelected && (
            <span className="block h-2 w-2 rounded-full bg-white mx-auto mt-0.5" />
          )}
        </span>
        <span className="font-medium">{option.label}</span>
      </div>
    </button>
  );
};

export default BaseOptionButton;