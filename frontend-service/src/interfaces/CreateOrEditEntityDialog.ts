import { EntityWizardValues } from '../common/dialogs/entity';
import { IEntity } from './entities';
import { IActionPopulated, IAction, ActionTypes } from './ruleBreaches/actionMetadata';
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

export type IMutationWithPayload =
    | { actionType: ActionTypes.CreateEntity; payload: undefined }
    | { actionType: ActionTypes.CreateClientSideEntity; payload: undefined }
    | { actionType: ActionTypes.UpdateEntity; payload: IEntity };

export type IMutationProps = IMutationWithPayload & {
    onSuccess?: (entity: IEntity) => void;
    onError?: (entity: EntityWizardValues) => void;
};
