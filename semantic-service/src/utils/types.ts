export interface IEvaluationResult {
    grades: {
        accuracy: number;
        completeness: number;
        clarity: number;
    };
    critique: string;
    hallucinations: string[];
    missingInfo: string;
}

export interface IValidationResult {
    isValid: boolean;
    detectedIssues: string;
}
