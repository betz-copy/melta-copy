import { IEntity } from '@packages/entity';
import { ActionTypes, IAction, IActionPopulated, IRuleBreach, IRuleBreachPopulated } from '@packages/rule-breach';
import { EntityWizardValues } from '../common/dialogs/entity';

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

export type IMutationWithPayload =
    | { actionType: ActionTypes.CreateEntity; payload: undefined }
    | { actionType: ActionTypes.CreateClientSideEntity; payload: undefined }
    | { actionType: ActionTypes.UpdateEntity; payload: IEntity };

export type IMutationProps = IMutationWithPayload & {
    onSuccess?: (entity: IEntity) => void;
    onError?: (entity: EntityWizardValues) => void;
};
