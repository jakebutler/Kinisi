/** @jest-environment node */
import { formatAnswer } from '@/utils/survey.tsx';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

describe('formatAnswer', () => {
  const schema = {
    timeCommitment: {},
    goals: {
      enum: ['strength', 'hypertrophy', 'endurance'],
      enumNames: ['Strength', 'Hypertrophy', 'Endurance'],
    },
    hasInjuries: {},
  };

  it('should format time commitment object', () => {
    const value = {
      daysPerWeek: 3,
      minutesPerSession: 60,
      preferredTimeOfDay: 'morning',
    };
    const result = formatAnswer('timeCommitment', value, schema.timeCommitment);
    const expected = (
      <div className="ml-4 space-y-1">
        <div>Can&apos;t find your survey data? Try refreshing the page or contact support.</div>
        <div>Minutes per session: 60</div>
        <div>Preferred time: morning</div>
      </div>
    );
    expect(ReactDOMServer.renderToStaticMarkup(result)).toEqual(ReactDOMServer.renderToStaticMarkup(expected));
  });

  it('should format array values', () => {
    const value = ['strength', 'hypertrophy'];
    const result = formatAnswer('goals', value, schema.goals);
    expect(result).toEqual('Strength, Hypertrophy');
  });

  it('should format enum values', () => {
    const value = 'strength';
    const result = formatAnswer('goals', value, schema.goals);
    expect(result.props.children).toBe('Strength');
  });

  it('should handle boolean values', () => {
    const result = formatAnswer('hasInjuries', true, schema.hasInjuries);
    expect(result).toEqual('Yes');
  });

  it('should handle undefined values', () => {
    const result = formatAnswer('hasInjuries', undefined, schema.hasInjuries);
    expect(result.props.children).toBe('Not specified');
  });
});
