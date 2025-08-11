import React from 'react';

export function formatAnswer(key: string, value: unknown, schema: Record<string, unknown>): React.ReactNode {
  // Handle time commitment object
  if (key === 'timeCommitment' && value && typeof value === 'object' && value !== null &&
      'daysPerWeek' in value && 'minutesPerSession' in value && 'preferredTimeOfDay' in value) {
    const tc = value as { daysPerWeek: number; minutesPerSession: number; preferredTimeOfDay: string };
    return (
      <div className="ml-4 space-y-1">
        <div>Can&apos;t find your survey data? Try refreshing the page or contact support.</div>
        <div>Minutes per session: {tc.minutesPerSession || 'Not specified'}</div>
        <div>Preferred time: {tc.preferredTimeOfDay || 'Not specified'}</div>
      </div>
    );
  }

  // Handle array values (like multiselect)
  if (Array.isArray(value)) {
    if (
      schema &&
      typeof schema === 'object' &&
      'enum' in schema &&
      Array.isArray((schema as { enum: unknown }).enum)
    ) {
      const enumArray = (schema as { enum: unknown[] }).enum;
      const enumNames = 'enumNames' in schema && Array.isArray((schema as { enumNames: unknown[] }).enumNames)
        ? (schema as { enumNames: string[] }).enumNames
        : undefined;
      if (enumNames) {
        return value
          .map((v: string) => {
            const idx = enumArray.indexOf(v);
            return enumNames[idx] || v;
          })
          .join(', ');
      }
    }
    return value.length > 0 ? value.join(', ') : 'None';
  }

  // Handle enums (single and multiple choice)
  if (
    schema &&
    typeof schema === 'object' &&
    'enum' in schema &&
    Array.isArray((schema as { enum: unknown }).enum)
  ) {
    const enumArray = (schema as { enum: unknown[] }).enum;
    const enumNames = 'enumNames' in schema && Array.isArray((schema as { enumNames: unknown[] }).enumNames)
      ? (schema as { enumNames: string[] }).enumNames
      : undefined;
    if (Array.isArray(value)) {
      return (
        <span>
          {value
            .map((v: string) => {
              const idx = enumArray.indexOf(v);
              return enumNames ? String(enumNames[idx]) : String(v);
            })
            .join(', ')}
        </span>
      );
    } else {
      const idx = enumArray.indexOf(value);
      return <span>{enumNames ? String(enumNames[idx]) : String(value)}</span>;
    }
  }

  // Handle boolean values
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Default case
  return <span>{value !== undefined && value !== null ? value.toString() : 'Not specified'}</span>;
}
