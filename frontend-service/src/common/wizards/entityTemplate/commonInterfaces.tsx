export interface CommonFormInputProperties {
    name: string;
    title: string;
    type: string;
    id: string;
    options: string[];
    optionColors?: Record<string, string>;
    pattern: string;
    patternCustomErrorMessage: string;
    dateNotification?: number | null;
    isDailyAlert?: boolean | null;
    calculateTime?: boolean | null;
    serialStarter?: number;
    required?: boolean;
    preview?: boolean;
    hide?: boolean;
    deleted?: boolean;
    uniqueCheckbox?: boolean;
    groupName?: string;
}
