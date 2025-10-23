import React from 'react';
import { SurveyQuestionProps } from '@/types/survey';
import OptionQuestion from './question-types/OptionQuestion';
import NumberInput from './question-types/NumberInput';
import TextInput from './question-types/TextInput';
import MultiSelectQuestion from './question-types/MultiSelectQuestion';
import QuestionGroup from './question-types/QuestionGroup';

const SurveyQuestion: React.FC<SurveyQuestionProps> = ({ question, value, onChange, error, disabled }) => {
  const renderQuestionInput = () => {
    switch (question.type) {
      case 'radio':
      case 'select':
        return (
          <OptionQuestion
            question={question}
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        );
      case 'number':
        return (
          <NumberInput
            question={question}
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        );
      case 'text':
        return (
          <TextInput
            question={question}
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        );
      case 'multiselect':
        return (
          <MultiSelectQuestion
            question={question}
            value={value}
            onChange={onChange}
            error={error}
            disabled={disabled}
          />
        );
      case 'group':
        return (
          <QuestionGroup
            question={question}
            value={value as Record<string, unknown>}
            onChange={(key: string, newValue: unknown) => {
              // For group questions, the onChange should handle nested updates
              const currentGroupValue = (value as Record<string, unknown>) || {};
              onChange({
                ...currentGroupValue,
                [key]: newValue
              });
            }}
            error={error}
            disabled={disabled}
          />
        );
      default:
        return (
          <div className="text-red-500">
            Unknown question type: {question.type}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {question.subtitle && (
        <p className="text-sm text-gray-600 mt-1">
          {question.subtitle}
        </p>
      )}
      {renderQuestionInput()}
    </div>
  );
};

export default SurveyQuestion;