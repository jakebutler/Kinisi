import React from 'react';
import Button from '../ui/Button';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';
import SurveyContainer from '@/components/survey/SurveyContainer';
import { intakeSurveyQuestions } from '@/utils/survey/questionDefinitions';
import { SurveyResponseData } from '@/types/survey';

interface IntakeSurveyProps {
  onNext: (surveyData: SurveyResponseData) => void;
  submitting?: boolean;
}

const IntakeSurvey: React.FC<IntakeSurveyProps> = ({ onNext, submitting = false }) => {
  const handleSubmit = async (responses: SurveyResponseData) => {
    onNext(responses);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Intake Survey</h2>

      <SurveyContainer
        questions={intakeSurveyQuestions}
        onSubmit={handleSubmit}
        showProgress={true}
        progressBarColor="bg-gradient-to-r from-[rgb(204,136,153)] via-[rgb(170,152,169)] to-[rgb(251,206,177)]"
        questionWrapperClassName="bg-white p-6 rounded-lg shadow-md"
        allowNavigation={true}
      />
    </div>
  );
};

export default IntakeSurvey;