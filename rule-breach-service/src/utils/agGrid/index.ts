import { IAgGridRequest } from '@packages/rule-breach';
import { translateAgGridFilterModel as baseTranslateFilterModel, translateAgGridSortModel } from '@packages/utils';
import { RuleBreachSearchFilterTypeError } from '../../express/error';

export const translateAgGridFilterModel = (filterModel: IAgGridRequest['filterModel']): object => {
    return baseTranslateFilterModel(filterModel, {
        onRelativeDateError: (type) => {
            throw new RuleBreachSearchFilterTypeError(`Relative date filter '${type}' should be resolved to date range before backend processing`);
        },
        onUnknownTypeError: (type) => {
            throw new RuleBreachSearchFilterTypeError(type);
        },
    });
};

export { translateAgGridSortModel };
