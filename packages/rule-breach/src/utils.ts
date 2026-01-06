import { relativeDateFilters } from './types';

/**
 * Type guard to check if a value is a valid relativeDateFilters enum value
 * @param value - The value to check
 * @returns True if the value is a valid relativeDateFilters enum value
 */
export function isRelativeDateFilter(value: unknown): value is relativeDateFilters {
	return Object.values(relativeDateFilters).includes(value as relativeDateFilters);
}


