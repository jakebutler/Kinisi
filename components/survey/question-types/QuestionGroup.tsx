import React from 'react';
import { QuestionGroupProps } from '@/types/survey';
import OptionQuestion from './OptionQuestion';
import NumberInput from './NumberInput';
import TextInput from './TextInput';
import MultiSelectQuestion from './MultiSelectQuestion';

const QuestionGroup: React.FC<QuestionGroupProps> = ({ question, value, onChange, error, disabled }) => {
  const groupValue = (value as Record<string, unknown>) || {};

  const handleFieldChange = (fieldKey: string, fieldValue: unknown) => {
    onChange(fieldKey, fieldValue);
  };

  const renderField = (field: any) => {
    const fieldValue = groupValue[field.key];
    const fieldError = typeof error === 'string' ? error : undefined;

    const commonProps = {
      question: field,
      value: fieldValue,
      onChange: (newValue: unknown) => handleFieldChange(field.key, newValue),
      error: fieldError,
      disabled
    };

    switch (field.type) {
      case 'radio':
      case 'select':
        return <OptionQuestion key={field.key} {...commonProps} />;
      case 'number':
        return <NumberInput key={field.key} {...commonProps} />;
      case 'text':
        return <TextInput key={field.key} {...commonProps} />;
      case 'multiselect':
        return <MultiSelectQuestion key={field.key} {...commonProps} />;
      default:
        return (
          <div key={field.key} className="text-red-500">
            Unknown question type: {field.type}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {question.fields?.map((field) => (
        <div key={field.key} className="mb-4">
          <label className="block font-medium mb-2 text-gray-700">
            {field.title}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField(field)}
        </div>
      ))}
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default QuestionGroup;