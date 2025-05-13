import { EntityWizardValues } from '../common/dialogs/entity';
import { IEntity, IMultipleSelect } from './entities';
import { IActionPopulated, IAction } from './ruleBreaches/actionMetadata';
import { IRuleBreachPopulated, IRuleBreach } from './ruleBreaches/ruleBreach';

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

export type IMutationWithPayload =
    | { actionType: MutationActionType.Create; payload: undefined }
    | { actionType: MutationActionType.Update; payload: IEntity }
    | { actionType: MutationActionType.UpdateMultiple; payload: IMultipleSelect<boolean> };

export type IMutationProps = IMutationWithPayload & {
    onSuccess?: (entity: IEntity) => void;
    onError?: (entity: EntityWizardValues) => void;
};
