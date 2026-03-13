/**
 * StepProgress – Visual progress indicator for the multi-step booking flow.
 * Shows four numbered circles (Seats → Details → Payment → Done)
 * with completed steps highlighted in green.
 */

import { Check } from "lucide-react"

const STEPS = ['Seats', 'Details', 'Payment', 'Done']

export default function StepProgress({ currentStep }) {
    return (
        <div className="flex items-center justify-center mb-12">
            {STEPS.map((label, index) => {
                const stepNumber = index + 1
                const isCompleted = currentStep > stepNumber || (stepNumber === 4 && currentStep === 4)
                const isActive = currentStep === stepNumber && !isCompleted

                return (
                    <div key={label} className="flex items-center">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs transition-colors duration-300 ${isCompleted
                                ? 'bg-green-500 text-white'
                                : isActive
                                    ? 'step-active'
                                    : 'bg-muted'
                            }`}>
                            {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                        </div>
                        {index < 3 && (
                            <div className={`w-8 sm:w-16 h-0.5 mx-2 transition-colors duration-300 ${currentStep > stepNumber ? 'bg-green-500' : 'bg-muted'}`} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
