import { BasicFilterOperationTypes, RelativeDateFilters } from './types';

export function isRelativeDateFilter(value: unknown): value is RelativeDateFilters {
    return Object.values(RelativeDateFilters).includes(value as RelativeDateFilters);
}

export function isBlankOrNotBlankFilter(type: unknown): boolean {
    return type === BasicFilterOperationTypes.blank || type === BasicFilterOperationTypes.notBlank;
}
