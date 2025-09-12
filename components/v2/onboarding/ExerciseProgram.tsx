import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import Button from '../ui/Button';
import type { ExerciseProgram as ExerciseProgramType } from '@/lib/v2/types';

interface ExerciseProgramProps {
  program: ExerciseProgramType;
  onApprove: () => void;
  onRequestUpdate: (feedback: string) => void;
  loading?: boolean;
}

const ExerciseProgram: React.FC<ExerciseProgramProps> = ({
  program,
  onApprove,
  onRequestUpdate,
  loading = false
}) => {
  const [isRequestingUpdates, setIsRequestingUpdates] = useState(false);
  const [updateRequest, setUpdateRequest] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<string[]>([]);
  const [expandedExercises, setExpandedExercises] = useState<string[]>([]);

  const handleApprove = () => {
    onApprove();
  };

  const handleRequestUpdates = () => {
    setIsRequestingUpdates(true);
  };

  const handleCancelRequest = () => {
    setIsRequestingUpdates(false);
    setUpdateRequest('');
  };

  const handleSubmitRequest = () => {
    if (updateRequest.trim()) {
      onRequestUpdate(updateRequest);
      setIsRequestingUpdates(false);
      setUpdateRequest('');
    }
  };

  const toggleSession = (sessionId: string) => {
    if (expandedSessions.includes(sessionId)) {
      setExpandedSessions(expandedSessions.filter(id => id !== sessionId));
    } else {
      setExpandedSessions([...expandedSessions, sessionId]);
    }
  };

  const toggleExerciseDetails = (exerciseId: string) => {
    if (expandedExercises.includes(exerciseId)) {
      setExpandedExercises(expandedExercises.filter(id => id !== exerciseId));
    } else {
      setExpandedExercises([...expandedExercises, exerciseId]);
    }
  };

  // Normalize shapes between current and legacy test data
  const isApproved = (program as any).status === 'approved' || (program as any).approved === true;
  const weeks: any[] = Array.isArray((program as any).program_json)
    ? (program as any).program_json
    : (Array.isArray((program as any).weeks) ? (program as any).weeks : []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {isApproved ? 'Your Exercise Program' : 'Your Exercise Program (Draft)'}
      </h2>
      {isApproved && (
        <div className="mb-4 text-green-700">✓ Program Approved</div>
      )}

      <div className="space-y-6 mb-6">
        {weeks && weeks.length > 0 ? (
          weeks.map((week: any, weekIndex: number) => (
            <div key={`week-${weekIndex}`} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <h3 className="font-medium">Week {weekIndex + 1}</h3>
                <p className="text-sm text-gray-600">{week.goal || 'Weekly fitness goals'}</p>
              </div>
              <div className="divide-y divide-gray-200">
                {week.sessions && Array.isArray(week.sessions) ? (
                  week.sessions.map((session: any, sessionIndex: number) => {
                    const sessionId = session.id || `session-${weekIndex}-${sessionIndex}`;
                    const isSessionExpanded = expandedSessions.includes(sessionId);
                    return (
                      <div key={sessionId} className="p-4">
                        <div 
                          className="flex justify-between items-center cursor-pointer" 
                          onClick={() => toggleSession(sessionId)}
                        >
                          <div>
                            <h4 className="font-medium">{session.name || `Session ${sessionIndex + 1}`}</h4>
                            <p className="text-sm text-gray-600">{session.goal || 'Session goals'}</p>
                          </div>
                          {isSessionExpanded ? (
                            <ChevronUpIcon size={20} className="text-gray-500" />
                          ) : (
                            <ChevronDownIcon size={20} className="text-gray-500" />
                          )}
                        </div>
                        {isSessionExpanded && (
                          <div className="mt-4 space-y-4">
                            {session.exercises && Array.isArray(session.exercises) ? (
                              session.exercises.map((exercise: any, exerciseIndex: number) => {
                                const exerciseId = exercise.id || `exercise-${weekIndex}-${sessionIndex}-${exerciseIndex}`;
                                const isExerciseExpanded = expandedExercises.includes(exerciseId);
                                return (
                                  <div key={exerciseId} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex justify-between">
                                      <div>
                                        <h5 className="font-medium">{exercise.name || 'Exercise'}</h5>
                                        <p className="text-sm text-gray-600">
                                          {exercise.sets || 1} sets × {exercise.reps || exercise.duration || 'As prescribed'}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => toggleExerciseDetails(exerciseId)}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                      >
                                        {isExerciseExpanded ? 'Hide details' : 'Full Details'}
                                      </button>
                                    </div>
                                    {isExerciseExpanded && (
                                      <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                                        {exercise.targetMuscles && Array.isArray(exercise.targetMuscles) && (
                                          <div className="mb-2">
                                            <span className="font-medium">Target muscles:</span>{' '}
                                            {exercise.targetMuscles.join(', ')}
                                          </div>
                                        )}
                                        {exercise.secondaryMuscles && Array.isArray(exercise.secondaryMuscles) && exercise.secondaryMuscles.length > 0 && (
                                          <div className="mb-2">
                                            <span className="font-medium">Secondary muscles:</span>{' '}
                                            {exercise.secondaryMuscles.join(', ')}
                                          </div>
                                        )}
                                        {exercise.instructions && (
                                          <div>
                                            <span className="font-medium">Instructions:</span>
                                            <p className="mt-1 text-gray-600">{exercise.instructions}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-gray-500 text-sm">No exercises available for this session.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4">
                    <p className="text-gray-500 text-sm">No sessions available for this week.</p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No program data available.</p>
          </div>
        )}
      </div>

      {isRequestingUpdates && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            What would you like to change about your program?
          </h3>
          <textarea
            value={updateRequest}
            onChange={(e) => setUpdateRequest(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none"
            rows={4}
            placeholder="Please describe what you'd like to change..."
          />
          <div className="flex gap-3 mt-3">
            <Button onClick={handleSubmitRequest} disabled={!updateRequest.trim() || loading}>
              Submit Request
            </Button>
            <Button variant="outline" onClick={handleCancelRequest}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {!isApproved && (
          <Button onClick={handleApprove} disabled={loading}>
            Approve Program
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={handleRequestUpdates}
          disabled={loading || isRequestingUpdates}
        >
          Request Updates
        </Button>
      </div>
    </div>
  );
};

export default ExerciseProgram;
