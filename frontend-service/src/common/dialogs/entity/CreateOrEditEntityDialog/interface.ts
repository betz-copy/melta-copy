import { EntityWizardValues } from '..';
import { IEntity, IMultipleSelect } from '../../../../interfaces/entities';
import { ITablesResults } from '../../../../interfaces/excel';
import { IActionPopulated, IAction } from '../../../../interfaces/ruleBreaches/actionMetadata';
import { IRuleBreachPopulated, IRuleBreach } from '../../../../interfaces/ruleBreaches/ruleBreach';

export type ICreateOrUpdateWithRuleBreachDialogState = {
    isOpen: boolean;
    brokenRules?: IRuleBreachPopulated['brokenRules'];
    rawBrokenRules?: IRuleBreach['brokenRules'];
    newEntityData?: EntityWizardValues;
    actions?: IActionPopulated[];
    rawActions?: IAction[];
};

export type IExternalErrors = {
    files: boolean;
    unique: Record<string, string>;
    action: string;
};

export enum MutationActionType {
    Update = 'update',
    Create = 'create',
    UpdateMultiple = 'updateMultiple',
}

// export type IMutationProps =
//     | { action: ActionType.Create; }
//     | { action: ActionType.Update; entityToUpdate: IEntity }
//     | { action: ActionType.UpdateMultiple; entitiesToUpdate: IMultipleSelect<boolean> };

export type IMutationProps =
    | { actionType: MutationActionType.Create; payload: undefined }
    | { actionType: MutationActionType.Update; payload: IEntity }
    | { actionType: MutationActionType.UpdateMultiple; payload: IMultipleSelect<boolean> };
