export interface CommonFormInputProperties {
    name: string;
    title: string;
    type: string;
    id: string;
    options: string[];
    optionColors?: Record<string, string | undefined>;
    pattern: string;
    patternCustomErrorMessage: string;
    dateNotification?: string | null;
    calculateTime?: boolean | null;
    serialStarter?: number;
    required?: boolean;
    preview?: boolean;
    hide?: boolean;
    uniqueCheckbox?: boolean;
    uniqueConstraints?: { groupName: string; properties: string[] }[];
}
