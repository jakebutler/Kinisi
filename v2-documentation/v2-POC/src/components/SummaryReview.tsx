import React, { useState } from 'react';
import Button from './Button';
interface SummaryReviewProps {
  selectedExercises: string[];
  onNext: () => void;
  onBack: () => void;
}
const SummaryReview: React.FC<SummaryReviewProps> = ({
  selectedExercises,
  onNext,
  onBack
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showToast, setShowToast] = useState(false);
  const handleFeedbackSubmit = () => {
    setShowToast(true);
    setShowFeedback(false);
    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };
  return <div>
      {showToast && <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-md shadow-md z-50 animate-fade-in">
          Processing your feedback...
        </div>}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Review Your Summary
      </h2>
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <p className="text-gray-700 mb-4">
          Based on your preferences for {selectedExercises.join(', ')}, we've
          created a personalized assessment of your fitness profile.
        </p>
        <p className="text-gray-700 mb-4">
          Your exercise preferences indicate you enjoy a mix of{' '}
          {selectedExercises.length > 1 ? 'different activities' : 'this activity'}
          . This suggests you would benefit from a varied program that
          incorporates these elements while gradually introducing complementary
          exercises to enhance your overall fitness.
        </p>
        <p className="text-gray-700">
          We recommend a balanced approach focusing on strength, flexibility,
          and cardiovascular health with special emphasis on the activities you
          already enjoy.
        </p>
      </div>
      {showFeedback && <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Your Feedback
          </h3>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" rows={4} placeholder="Please share your thoughts on this assessment..." />
        </div>}
      <div className="flex justify-between">
        {showFeedback ? <>
            <Button variant="outline" onClick={() => setShowFeedback(false)}>
              Cancel
            </Button>
            <Button onClick={handleFeedbackSubmit}>Submit</Button>
          </> : <>
            <Button variant="outline" onClick={() => setShowFeedback(true)}>
              Provide Feedback
            </Button>
            <Button onClick={onNext}>Approve</Button>
          </>}
      </div>
    </div>;
};
export default SummaryReview;