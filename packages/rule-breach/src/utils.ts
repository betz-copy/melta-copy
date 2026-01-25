import { RelativeDateFilters } from './types';

export function isRelativeDateFilter(value: unknown): value is RelativeDateFilters {
    return Object.values(RelativeDateFilters).includes(value as RelativeDateFilters);
}
