"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

export default function OnboardingProgress({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  const steps = [1, 2, 3, 4];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8" aria-label="Onboarding progress">
      <div className="relative flex items-center justify-between px-6">
        {/* Base line */}
        <div className="absolute top-4 left-6 right-6 h-[2px] bg-gray-200" aria-hidden />

        {/* Completed segments */}
        {Array.from({ length: steps.length - 1 }).map((_, index) => {
          const isCompleted = index + 1 < currentStep; // segment between step index and index+1
          const segmentWidth = `calc(100% / ${steps.length - 1})`;
          return (
            <div
              key={`seg-${index}`}
              className={`absolute top-4 h-[2px] ${isCompleted ? "bg-green-500" : "bg-gray-200"}`}
              style={{ left: `calc(${index} * ${segmentWidth} + 6px + 16px)`, width: `calc(${segmentWidth} - 32px)` }}
              aria-hidden
            />
          );
        })}

        {/* Step circles */}
        {steps.map((_, index) => {
          const stepNumber = (index + 1) as 1 | 2 | 3 | 4;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          return (
            <div key={`step-${stepNumber}`} className="z-10 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "border-2 border-[var(--brand-puce)] bg-white text-[var(--brand-puce)]"
                    : "bg-gray-200 text-gray-500"
                }`}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${stepNumber}${isCompleted ? " completed" : isCurrent ? " current" : ""}`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 11.586l6.543-6.543a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{stepNumber}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
