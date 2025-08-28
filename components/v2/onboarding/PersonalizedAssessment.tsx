import React, { useState } from 'react';
import Button from '../ui/Button';

interface Assessment {
  id: string;
  user_id: string;
  survey_response_id: string;
  assessment: string;
  approved: boolean;
  created_at: string;
}

interface PersonalizedAssessmentProps {
  assessment: Assessment;
  onApprove?: () => void;
  onRequestUpdate?: (feedback: string) => void;
  loading?: boolean;
  isActive?: boolean;
  onNext?: () => void;
  onBack?: () => void;
}

const PersonalizedAssessment: React.FC<PersonalizedAssessmentProps> = ({
  onApprove,
  onRequestUpdate,
  isActive = false,
  assessment,
  loading = false,
  onNext,
  onBack
}) => {
  const [status, setStatus] = useState<'draft' | 'approved'>('draft');
  const [isRequestingUpdates, setIsRequestingUpdates] = useState(false);
  const [updateRequest, setUpdateRequest] = useState('');
  const [showProgramUpdateOptions, setShowProgramUpdateOptions] = useState(false);

  const handleApprove = async () => {
    setStatus('approved');
    if (onApprove) {
      await onApprove();
    } else if (isActive) {
      setShowProgramUpdateOptions(true);
    } else if (onNext) {
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

  const handleSubmitRequest = async () => {
    if (onRequestUpdate) {
      await onRequestUpdate(updateRequest);
    } else {
      // Fallback for POC mode
      console.log('Update request submitted:', updateRequest);
      // Simulate receiving an updated assessment
      setTimeout(() => {
        alert('Your personalized assessment has been updated!');
        setStatus('draft');
      }, 1000);
    }
    setIsRequestingUpdates(false);
    setUpdateRequest('');
  };

  const handleProgramUpdateChoice = (choice: string) => {
    console.log('Program update choice:', choice);
    setShowProgramUpdateOptions(false);
    // TODO: Integrate with backend API based on choice
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {status === 'draft' ? 'Your Personalized Assessment (Draft)' : 'Your Personalized Assessment'}
      </h2>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Assessment Summary
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700">Current Fitness Level</h4>
            <p className="text-gray-600">
              {assessment?.assessment || 
                `Based on your responses, you're at a beginner to intermediate
                level. You have some experience with Bodyweight exercises and Running,
                but would benefit from a structured program to build consistency.`
              }
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">
              Physical Considerations
            </h4>
            <p className="text-gray-600">
              We've noted your physical considerations and will ensure all recommended
              exercises are appropriate and won't put excessive strain on any areas of concern.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">
              Recommended Focus Areas
            </h4>
            <ul className="list-disc list-inside text-gray-600">
              <li>Core strength development</li>
              <li>Upper body conditioning</li>
              <li>Cardiovascular endurance</li>
              <li>Flexibility and mobility</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">
              Program Structure Recommendation
            </h4>
            <p className="text-gray-600">
              A structured program with sessions tailored to your availability and goals.
              We recommend a balanced approach focusing on your preferred exercise types
              while gradually introducing complementary activities.
            </p>
          </div>
        </div>
      </div>

      {isRequestingUpdates && (
        <div className="mb-6">
          <textarea
            value={updateRequest}
            onChange={e => setUpdateRequest(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Type your request here"
          />
        </div>
      )}

      {showProgramUpdateOptions && (
        <div className="mb-6 bg-gray-50 p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-3">Would you like to:</h4>
          <div className="space-y-3">
            <button
              className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              onClick={() => handleProgramUpdateChoice('update_current')}
            >
              Update remaining sessions in your current program
            </button>
            <button
              className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              onClick={() => handleProgramUpdateChoice('new_program')}
            >
              Start a new program with the updated assessment
            </button>
            <button
              className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              onClick={() => handleProgramUpdateChoice('no_change')}
            >
              Continue with your current program (no changes)
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        {!onBack && <div />}
        <div className="flex gap-3">
          {status === 'approved' && !isRequestingUpdates && !showProgramUpdateOptions ? (
            <div className="flex items-center">
              <span className="italic text-gray-500 mr-4">Approved</span>
              <Button variant="outline" onClick={handleRequestUpdates}>
                Request Updates
              </Button>
            </div>
          ) : isRequestingUpdates ? (
            <>
              <Button variant="outline" onClick={handleCancelRequest}>
                Cancel
              </Button>
              <Button onClick={handleSubmitRequest} disabled={!updateRequest.trim()}>
                Submit Request
              </Button>
            </>
          ) : !showProgramUpdateOptions ? (
            <>
              <Button variant="outline" onClick={handleRequestUpdates}>
                Request Updates
              </Button>
              <Button onClick={handleApprove} disabled={loading}>
                {loading ? 'Processing...' : 'Approve'}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PersonalizedAssessment;
