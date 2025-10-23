import React from 'react';
import { SurveyQuestionProps } from '@/types/survey';

const MultiSelectQuestion: React.FC<SurveyQuestionProps> = ({ question, value, onChange, error, disabled }) => {
  const selectedValues = Array.isArray(value) ? (value as string[]) : [];

  const handleToggle = (optionValue: string) => {
    if (disabled) return;

    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter(v => v !== optionValue)
      : [...selectedValues, optionValue];

    onChange(newValues);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {question.options?.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleToggle(option.value)}
              disabled={disabled}
              className={`
                px-3 py-1.5 rounded-full border text-sm transition
                ${isSelected
                  ? 'bg-[var(--brand-puce)] text-white border-[var(--brand-puce)]'
                  : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default MultiSelectQuestion;