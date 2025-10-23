import React from 'react';
import { SurveyQuestionProps, SurveyQuestion } from '@/types/survey';

const NumberInput: React.FC<SurveyQuestionProps> = ({ question, value, onChange, error, disabled }) => {
  const numValue = typeof value === 'number' ? value : (value === '' ? '' : Number(value));
  const cleanValue = typeof numValue === 'number' && !Number.isNaN(numValue) ? numValue : (question.min ?? 0);

  // Check if this is a 0-10 scale based on title or min/max values
  const isZeroToTenScale = (q: SurveyQuestion) => {
    const title = q.title || '';
    return /0\s*[–-]\s*10/.test(title) ||
           (typeof q.min === 'number' && typeof q.max === 'number' &&
            q.min === 0 && q.max === 10);
  };

  const handleScaleClick = (value: number) => {
    onChange(value);
  };

  const handleIncrement = () => {
    const newValue = cleanValue + 1;
    if (question.max === undefined || newValue <= question.max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = cleanValue - 1;
    if (question.min === undefined || newValue >= question.min) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value === '' ? '' : Number(e.target.value);
    onChange(newValue);
  };

  if (isZeroToTenScale(question)) {
    const scaleValue = typeof numValue === 'number' && !Number.isNaN(numValue) ? numValue : 0;

    return (
      <div>
        <div className="mb-2 text-sm text-gray-600 flex items-center gap-2">
          <span className="text-gray-500">Selected:</span>
          <span className="font-semibold text-gray-900" data-testid="scale-selected-value">
            {scaleValue}
          </span>
        </div>
        <div className="grid grid-cols-11 gap-1 sm:gap-2" role="group" aria-label="0 to 10 scale" data-testid="scale-0-10">
          {Array.from({ length: 11 }).map((_, i) => {
            const isSelected = scaleValue === i;
            return (
              <button
                key={i}
                type="button"
                role="button"
                aria-pressed={isSelected}
                onClick={() => handleScaleClick(i)}
                disabled={disabled}
                className={`
                  h-10 sm:h-12 rounded-md border text-sm font-medium transition
                  ${isSelected
                    ? 'bg-[var(--brand-puce)] text-white border-[var(--brand-puce)]'
                    : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                data-testid={`scale-box-${i}`}
              >
                {i}
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
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || (question.min !== undefined && cleanValue <= question.min)}
          className="h-10 w-10 rounded-lg border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Decrease"
        >
          −
        </button>
        <input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-24 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-puce)] disabled:opacity-50"
          min={question.min}
          max={question.max}
          required={question.required}
          aria-invalid={!!error}
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || (question.max !== undefined && cleanValue >= question.max)}
          className="h-10 w-10 rounded-lg border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Increase"
        >
          +
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default NumberInput;