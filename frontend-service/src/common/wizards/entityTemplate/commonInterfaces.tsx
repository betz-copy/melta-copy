export interface CommonFormInputProperties {
    name: string;
    title: string;
    type: string;
    id: string;
    options: string[];
    pattern: string;
    patternCustomErrorMessage: string;
    dateNotification?: string | null;
    required?: boolean;
    preview?: boolean;
    hide?: boolean;
    unique?: boolean;
}
