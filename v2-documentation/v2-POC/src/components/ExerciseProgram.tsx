import React, { useState } from 'react';
import Button from './Button';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
interface ExerciseProgramProps {
  onNext: () => void;
  onBack: () => void;
  isActive?: boolean;
}
const ExerciseProgram: React.FC<ExerciseProgramProps> = ({
  onNext,
  onBack,
  isActive = false
}) => {
  const [status, setStatus] = useState<'draft' | 'approved'>('draft');
  const [isRequestingUpdates, setIsRequestingUpdates] = useState(false);
  const [updateRequest, setUpdateRequest] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<string[]>([]);
  const [expandedExercises, setExpandedExercises] = useState<string[]>([]);
  const handleApprove = () => {
    setStatus('approved');
    if (!isActive) {
      onNext();
    }
  };
  const handleRequestUpdates = () => {
    setIsRequestingUpdates(true);
  };
  const handleCancelRequest = () => {
    setIsRequestingUpdates(false);
    setUpdateRequest('');
  };
  const handleSubmitRequest = () => {
    // In a real app, this would send the request to the backend
    console.log('Update request submitted:', updateRequest);
    setIsRequestingUpdates(false);
    setUpdateRequest('');
    // Simulate receiving an updated program
    setTimeout(() => {
      alert('Your exercise program has been updated!');
      setStatus('draft');
    }, 1000);
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
  // Sample program data structure
  const program = [{
    week: 1,
    goal: 'Build foundational strength and establish routine',
    sessions: [{
      id: 'w1s1',
      name: 'Session 1',
      goal: 'Upper body and core focus',
      exercises: [{
        id: 'w1s1e1',
        name: 'Push-ups',
        sets: 3,
        reps: '8-10',
        targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
        secondaryMuscles: ['Core'],
        instructions: 'Start in a plank position with hands slightly wider than shoulder-width apart. Lower your body until your chest nearly touches the floor, then push back up.'
      }, {
        id: 'w1s1e2',
        name: 'Plank',
        duration: '30 seconds',
        sets: 3,
        targetMuscles: ['Core'],
        secondaryMuscles: ['Shoulders', 'Back'],
        instructions: 'Start in a push-up position, then bend your elbows and rest your weight on your forearms. Keep your body in a straight line from head to feet.'
      }]
    }, {
      id: 'w1s2',
      name: 'Session 2',
      goal: 'Lower body strength and mobility',
      exercises: [{
        id: 'w1s2e1',
        name: 'Bodyweight Squats',
        sets: 3,
        reps: '12-15',
        targetMuscles: ['Quadriceps', 'Glutes'],
        secondaryMuscles: ['Hamstrings', 'Core'],
        instructions: 'Stand with feet shoulder-width apart. Lower your body as if sitting in a chair, keeping your chest up and knees behind toes.'
      }, {
        id: 'w1s2e2',
        name: 'Walking Lunges',
        sets: 2,
        reps: '10 each leg',
        targetMuscles: ['Quadriceps', 'Glutes'],
        secondaryMuscles: ['Hamstrings', 'Core'],
        instructions: 'Step forward with one leg and lower your hips until both knees are bent at about 90 degrees. Push off with your back foot and bring it forward to repeat on the other side.'
      }]
    }]
  }, {
    week: 2,
    goal: 'Increase intensity and build endurance',
    sessions: [{
      id: 'w2s1',
      name: 'Session 1',
      goal: 'Full body circuit training',
      exercises: [{
        id: 'w2s1e1',
        name: 'Mountain Climbers',
        duration: '30 seconds',
        sets: 3,
        targetMuscles: ['Core', 'Shoulders'],
        secondaryMuscles: ['Chest', 'Hip Flexors'],
        instructions: 'Start in a plank position. Drive one knee toward your chest, then quickly switch legs in a running motion.'
      }]
    }]
  }];
  return <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {status === 'draft' ? 'Your Exercise Program (Draft)' : 'Your Exercise Program'}
      </h2>
      <div className="space-y-6 mb-6">
        {program.map(week => <div key={`week-${week.week}`} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <h3 className="font-medium">Week {week.week}</h3>
              <p className="text-sm text-gray-600">{week.goal}</p>
            </div>
            <div className="divide-y divide-gray-200">
              {week.sessions.map(session => {
            const isSessionExpanded = expandedSessions.includes(session.id);
            return <div key={session.id} className="p-4">
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSession(session.id)}>
                      <div>
                        <h4 className="font-medium">{session.name}</h4>
                        <p className="text-sm text-gray-600">{session.goal}</p>
                      </div>
                      {isSessionExpanded ? <ChevronUpIcon size={20} className="text-gray-500" /> : <ChevronDownIcon size={20} className="text-gray-500" />}
                    </div>
                    {isSessionExpanded && <div className="mt-4 space-y-4">
                        {session.exercises.map(exercise => {
                  const isExerciseExpanded = expandedExercises.includes(exercise.id);
                  return <div key={exercise.id} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between">
                                <div>
                                  <h5 className="font-medium">
                                    {exercise.name}
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    {exercise.sets} sets ×{' '}
                                    {exercise.reps || exercise.duration}
                                  </p>
                                </div>
                                <button className="text-blue-500 text-sm flex items-center" onClick={e => {
                        e.stopPropagation();
                        toggleExerciseDetails(exercise.id);
                      }}>
                                  {isExerciseExpanded ? 'Hide Details' : 'Full Details'}
                                  {isExerciseExpanded ? <ChevronUpIcon size={16} className="ml-1" /> : <ChevronDownIcon size={16} className="ml-1" />}
                                </button>
                              </div>
                              {isExerciseExpanded && <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                                  <div className="mb-2">
                                    <span className="font-medium">
                                      Target muscles:
                                    </span>{' '}
                                    {exercise.targetMuscles.join(', ')}
                                  </div>
                                  <div className="mb-2">
                                    <span className="font-medium">
                                      Secondary muscles:
                                    </span>{' '}
                                    {exercise.secondaryMuscles.join(', ')}
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      Instructions:
                                    </span>
                                    <p className="mt-1 text-gray-600">
                                      {exercise.instructions}
                                    </p>
                                  </div>
                                </div>}
                            </div>;
                })}
                      </div>}
                  </div>;
          })}
            </div>
          </div>)}
      </div>
      {isRequestingUpdates ? <div className="mb-6">
          <textarea value={updateRequest} onChange={e => setUpdateRequest(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={4} placeholder="Type your request here" />
        </div> : null}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-3">
          {status === 'approved' && !isRequestingUpdates ? <div className="flex items-center">
              <span className="italic text-gray-500 mr-4">Approved</span>
              <Button variant="outline" onClick={handleRequestUpdates}>
                Request Updates
              </Button>
            </div> : isRequestingUpdates ? <>
              <Button variant="outline" onClick={handleCancelRequest}>
                Cancel
              </Button>
              <Button onClick={handleSubmitRequest} disabled={!updateRequest.trim()}>
                Submit Request
              </Button>
            </> : <>
              <Button variant="outline" onClick={handleRequestUpdates}>
                Request Updates
              </Button>
              <Button onClick={handleApprove}>Approve</Button>
            </>}
        </div>
      </div>
    </div>;
};
export default ExerciseProgram;