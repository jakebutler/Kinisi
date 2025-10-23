import React from 'react';
import { SurveyQuestionProps } from '@/types/survey';
import BaseOptionButton from '../shared/BaseOptionButton';

const OptionQuestion: React.FC<SurveyQuestionProps> = ({
  question,
  value,
  onChange,
  error,
  disabled
}) => {
  const selectedValue = typeof value === 'string' ? value : '';

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
  };

  // Determine role and ARIA props based on question type
  const isRadioType = question.type === 'radio';
  const role = isRadioType ? 'radio' : 'option';
  const containerRole = isRadioType ? 'radiogroup' : 'listbox';
  const ariaLabel = isRadioType ? undefined : question.title;

  return (
    <div>
      <div role={containerRole} aria-label={ariaLabel} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options?.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <BaseOptionButton
              key={option.value}
              option={option}
              isSelected={isSelected}
              onSelect={handleSelect}
              role={role}
              disabled={disabled}
              aria-checked={isRadioType ? isSelected : undefined}
              aria-selected={!isRadioType ? isSelected : undefined}
            />
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

export default OptionQuestion;