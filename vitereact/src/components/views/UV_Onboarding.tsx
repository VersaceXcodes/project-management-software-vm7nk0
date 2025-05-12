import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/main";
import axios from "axios";

const UV_Onboarding: React.FC = () => {
  // Local state for onboarding
  const [onboardingSteps] = useState<Array<{
    step_id: string;
    title: string;
    description: string;
    image_url: string;
  }>>([
    {
      step_id: "1",
      title: "Welcome to ProjectPro",
      description: "Manage your projects easily and efficiently.",
      image_url: "https://picsum.photos/seed/1/300/200",
    },
    {
      step_id: "2",
      title: "Create New Projects",
      description: "Start new projects to organize your team's tasks.",
      image_url: "https://picsum.photos/seed/2/300/200",
    },
    {
      step_id: "3",
      title: "Collaborate with Your Team",
      description: "Communicate and track project progress with seamless collaboration.",
      image_url: "https://picsum.photos/seed/3/300/200",
    },
  ]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);

  // Access global current_user from Redux store (if available for profile update)
  const currentUser = useSelector((state: RootState) => state.global.current_user);

  // Function to finish onboarding: set completion flag and update user profile optionally
  const finishOnboarding = async () => {
    setOnboardingCompleted(true);
    if (currentUser) {
      try {
        // Optionally update the user's profile to mark onboarding as complete.
        // We use import.meta.env.VITE_API_BASE_URL to get the API base URL.
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/api/users/${currentUser.id}`,
          { onboarding_completed: true }
        );
      } catch (error) {
        console.error("Error updating onboarding status", error);
      }
    }
  };

  // Function to advance the onboarding step; finish if last step is reached.
  const nextStep = () => {
    if (currentStepIndex < onboardingSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      finishOnboarding();
    }
  };

  // Function to allow user to skip the onboarding process entirely
  const skipOnboarding = () => {
    finishOnboarding();
  };

  // If onboarding is completed, do not render the overlay
  if (onboardingCompleted) return null;

  // Get current step for display
  const currentStep = onboardingSteps[currentStepIndex];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto text-center">
          {currentStep && (
            <>
              <img
                src={currentStep.image_url}
                alt={currentStep.title}
                className="w-full h-auto mb-4 rounded"
              />
              <h2 className="text-2xl font-bold mb-2">{currentStep.title}</h2>
              <p className="mb-4 text-gray-700">{currentStep.description}</p>
            </>
          )}
          <div className="flex justify-between">
            <button
              onClick={skipOnboarding}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
            >
              Skip
            </button>
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              {currentStepIndex === onboardingSteps.length - 1
                ? "Finish"
                : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Onboarding;