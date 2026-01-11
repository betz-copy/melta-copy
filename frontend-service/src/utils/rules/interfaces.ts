import { ValueSource } from '@react-awesome-query-builder/mui';

export type ValueType = 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'dateDuration' | 'dateTimeDuration';
export type FunctionObject = {
    func: 'addToDate' | 'addToDateTime' | 'subFromDate' | 'subFromDateTime'; // toDate not shown as function
    // biome-ignore lint/suspicious/noExplicitAny: never doubt Noam
    args: Record<string, { valueSrc: ValueSource; value: any }>;
};
