import { FilterQuery } from 'mongoose';

type FieldPath<T> = keyof T | (string & {});

/**
 * This class is for building queries in a more readable and maintainable way.
 * There are methods for all types of queries I could think of, but it can be extended.
 * Each method accepts an optional condition parameter to save you the if(condition) before.
 */
export class MongoQueryBuilder<T> {
    private filter: FilterQuery<T> = {};

    private getOperatorObject(field: FieldPath<T>): Record<string, unknown> {
        const current = this.filter[field as string];
        if (current && typeof current === 'object' && !Array.isArray(current) && !(current instanceof Date) && !(current instanceof RegExp)) {
            return { ...current };
        }

        return current !== undefined ? { $eq: current } : {};
    }

    private mergeOperator<K extends FieldPath<T>>(field: K, operator: string, value: unknown): this {
        const next = this.getOperatorObject(field);
        next[operator] = value;
        this.filter = {
            ...this.filter,
            [field]: next,
        };

        return this;
    }

    private addLogicalConditions(operator: '$or' | '$and' | '$nor', conditions: Partial<FilterQuery<T>>[]): this {
        const current = this.filter[operator as string];
        const next = Array.isArray(current) ? [...current, ...conditions] : conditions;
        this.filter = {
            ...this.filter,
            [operator]: next,
        };

        return this;
    }

    where<K extends FieldPath<T>>(field: K, value: unknown, condition: boolean = true): this {
        if (!condition || value === undefined) return this;

        return this.mergeOperator(field, '$eq', value);
    }

    whereMultiple(conditions: Partial<FilterQuery<T>>, condition: boolean = true): this {
        if (!condition || !Object.keys(conditions)?.length) return this;
        this.filter = { ...this.filter, ...conditions };

        return this;
    }

    whereIn<K extends FieldPath<T>>(field: K, values: unknown[] | undefined, condition: boolean = true): this {
        if (!condition || !values?.length) return this;

        return this.mergeOperator(field, '$in', values);
    }

    whereNotIn<K extends FieldPath<T>>(field: K, values: unknown[] | undefined, condition: boolean = true): this {
        if (!condition || !values?.length) return this;

        return this.mergeOperator(field, '$nin', values);
    }

    whereGreaterThan<K extends FieldPath<T>>(field: K, value: number | Date | undefined, condition: boolean = true): this {
        if (!condition || value === undefined) return this;

        return this.mergeOperator(field, '$gt', value);
    }

    whereLessThan<K extends FieldPath<T>>(field: K, value: number | Date | undefined, condition: boolean = true): this {
        if (!condition || value === undefined) return this;

        return this.mergeOperator(field, '$lt', value);
    }

    whereGreaterThanOrEqual<K extends FieldPath<T>>(field: K, value: number | Date | undefined, condition: boolean = true): this {
        if (!condition || value === undefined) return this;

        return this.mergeOperator(field, '$gte', value);
    }

    whereLessThanOrEqual<K extends FieldPath<T>>(field: K, value: number | Date | undefined, condition: boolean = true): this {
        if (!condition || value === undefined) return this;

        return this.mergeOperator(field, '$lte', value);
    }

    whereBetween<K extends FieldPath<T>>(field: K, min: number | Date | undefined, max: number | Date | undefined, condition: boolean = true): this {
        if (!condition || min === undefined || max === undefined) return this;
        this.mergeOperator(field, '$gte', min);

        return this.mergeOperator(field, '$lte', max);
    }

    whereRegex<K extends FieldPath<T>>(field: K, pattern: string | undefined, options: string = 'i', condition: boolean = true): this {
        if (!condition || !pattern) return this;
        this.mergeOperator(field, '$regex', pattern);

        return this.mergeOperator(field, '$options', options);
    }

    whereExists<K extends FieldPath<T>>(field: K, exists: boolean = true, condition: boolean = true): this {
        if (!condition) return this;

        return this.mergeOperator(field, '$exists', exists);
    }

    whereNotEqual<K extends FieldPath<T>>(field: K, value: unknown, condition: boolean = true): this {
        if (!condition) return this;

        return this.mergeOperator(field, '$ne', value);
    }

    whereElemMatch<K extends FieldPath<T>>(field: K, match: Record<string, unknown>, condition: boolean = true): this {
        if (!condition || !Object.keys(match)?.length) return this;

        return this.mergeOperator(field, '$elemMatch', match);
    }

    orWhere(conditions: Partial<FilterQuery<T>>[], condition: boolean = true): this {
        if (!condition || !conditions?.length) return this;

        return this.addLogicalConditions('$or', conditions);
    }

    andWhere(conditions: Partial<FilterQuery<T>>[], condition: boolean = true): this {
        if (!condition || !conditions?.length) return this;

        return this.addLogicalConditions('$and', conditions);
    }

    norWhere(conditions: Partial<FilterQuery<T>>[], condition: boolean = true): this {
        if (!condition || !conditions?.length) return this;

        return this.addLogicalConditions('$nor', conditions);
    }

    searchText(
        search: string | undefined,
        options: { language?: string; caseSensitive?: boolean; diacriticSensitive?: boolean } = {},
        condition: boolean = true,
    ): this {
        if (!condition || !search) return this;
        const textSearch: Record<string, unknown> = { $search: search };

        if (options.language) textSearch.$language = options.language;

        if (options.caseSensitive !== undefined) textSearch.$caseSensitive = options.caseSensitive;

        if (options.diacriticSensitive !== undefined) textSearch.$diacriticSensitive = options.diacriticSensitive;

        this.filter = {
            ...this.filter,
            $text: textSearch,
        };
        return this;
    }

    build(): FilterQuery<T> {
        return this.filter;
    }

    reset(): this {
        this.filter = {} as FilterQuery<T>;

        return this;
    }
}
