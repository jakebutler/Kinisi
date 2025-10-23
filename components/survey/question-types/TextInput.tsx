import React from 'react';
import { SurveyQuestionProps } from '@/types/survey';

const TextInput: React.FC<SurveyQuestionProps> = ({ question, value, onChange, error, disabled }) => {
  const textValue = typeof value === 'string' ? value : '';
  const characterCount = textValue.length;
  const maxCharacters = 1000;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // Enforce maximum character limit
    if (newValue.length <= maxCharacters) {
      onChange(newValue);
    }
  };

  return (
    <div>
      <textarea
        value={textValue}
        onChange={handleChange}
        disabled={disabled}
        className={`
          w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-puce)]
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
        `}
        rows={4}
        required={question.required}
        placeholder={question.required ? 'Please enter your response...' : 'Optional response...'}
        aria-invalid={!!error}
        maxLength={maxCharacters}
      />
      <div className="mt-1 text-xs text-gray-500 flex justify-between">
        <span>Character count: {characterCount}/{maxCharacters}</span>
        {question.required && !textValue.trim() && (
          <span className="text-orange-500">Required</span>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default TextInput;