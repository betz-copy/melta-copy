import { ProcessDetailsValues } from '../../common/wizards/processInstance/ProcessDetails';
import { SummaryDetailsValues } from '../../common/wizards/processInstance/ProcessSummaryStep';

export function isProcessDetailsValues(obj: any): obj is ProcessDetailsValues {
    return (
        obj &&
        'template' in obj &&
        typeof obj.name === 'string' &&
        typeof obj.details === 'object' &&
        typeof obj.detailsAttachments === 'object' &&
        'steps' in obj
    );
}

export function isSummaryDetailsValues(obj: any): obj is SummaryDetailsValues {
    return obj && typeof obj.summaryDetails === 'object' && typeof obj.summaryAttachments === 'object' && 'status' in obj;
}
