/* eslint-disable default-case */
import {
    basicFilterOperationTypes,
    filterTypes,
    IAgGridRequest,
    numberFilterOperationTypes,
    textFilterOperationTypes,
} from '../../utils/interfaces/agGrid';
import { RuleBreachSearchFilterTypeError } from '../error';
import { IRuleBreachDocument } from './interface';
import RuleBreachesModel from './model';

export class RuleBreachesManager {
    public static async searchRuleBreaches(originUserId: string, agGridRequest: IAgGridRequest): Promise<IRuleBreachDocument[]> {
        const { startRow, endRow, sortModel, filterModel } = agGridRequest;

        const limit = endRow - startRow;
        const skip = startRow;

        const query = await this.translateAgGridFilterModel(filterModel);
        if (originUserId) query.originUserId = originUserId;

        const sort: any = {};
        sortModel.forEach(({ colId, sort: sortType }) => {
            sort[colId] = sortType === 'asc' ? 1 : -1;
        });

        return RuleBreachesModel.find(query, {}, { skip, limit }).exec();
    }

    private static async translateAgGridFilterModel(filterModel: IAgGridRequest['filterModel']) {
        const query: any = {};

        Object.entries(filterModel).forEach(([field, filter]) => {
            switch (filter.filterType) {
                case filterTypes.text:
                    query[field] = this.translateAgGridFilter(filter.type, filter.filter);
                    break;
                case filterTypes.number:
                    query[field] = this.translateAgGridFilter(filter.type, filter.filter, filter.filterTo);
                    break;
                case filterTypes.date:
                    query[field] = this.translateAgGridFilter(filter.type, filter.dateFrom, filter.dateTo);
                    break;
                case filterTypes.set:
                    query[field] = { $in: filter.values };
                    break;
            }
        });

        return query;
    }

    private static async translateAgGridFilter(
        type: basicFilterOperationTypes | numberFilterOperationTypes | textFilterOperationTypes,
        filterValue: any,
        other?: any,
    ) {
        switch (type) {
            case basicFilterOperationTypes.equals:
                return filterValue;
            case basicFilterOperationTypes.notEqual:
                return { $ne: filterValue };
            case basicFilterOperationTypes.blank:
                return { $exists: false };
            case basicFilterOperationTypes.notBlank:
                return { $exists: true };

            case numberFilterOperationTypes.lessThan:
                return { $lt: filterValue };
            case numberFilterOperationTypes.lessThanOrEqual:
                return { $lte: filterValue };
            case numberFilterOperationTypes.greaterThan:
                return { $gt: filterValue };
            case numberFilterOperationTypes.greaterThanOrEqual:
                return { $gte: filterValue };
            case numberFilterOperationTypes.inRange:
                return { $gte: filterValue, $lte: other };

            case textFilterOperationTypes.contains:
                return { $regex: new RegExp(filterValue, 'i') };
            case textFilterOperationTypes.notContains:
                return { $not: { $regex: new RegExp(filterValue, 'i') } };
            case textFilterOperationTypes.startsWith:
                return { $regex: new RegExp(`^${filterValue}`, 'i') };
            case textFilterOperationTypes.endsWith:
                return { $regex: new RegExp(`${filterValue}$`, 'i') };
        }

        throw new RuleBreachSearchFilterTypeError(type);
    }
}

export default RuleBreachesManager;
