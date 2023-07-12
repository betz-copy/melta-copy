export interface CommonFormInputProperties {
    name: string;
    title: string;
    type: string;
    id: string;
    options: string[];
    pattern: string;
    patternCustomErrorMessage: string;
    required?: boolean;
    preview?: boolean;
    hide?: boolean;
    unique?: boolean;
}
