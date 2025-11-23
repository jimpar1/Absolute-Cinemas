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
            {STEPS.map((label, index) => (
                <div key={label} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs ${currentStep > index + 1
                            ? 'bg-green-500 text-white'
                            : currentStep === index + 1
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                        }`}>
                        {currentStep > index + 1 ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    {index < 3 && <div className="w-8 sm:w-16 h-0.5 bg-muted mx-2" />}
                </div>
            ))}
        </div>
    )
}
