import { ValueSource } from 'react-awesome-query-builder';

export type ValueType = 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'dateDuration' | 'dateTimeDuration';
export type FunctionObject = {
    func: 'addToDate' | 'addToDateTime' | 'subFromDate' | 'subFromDateTime'; // toDate not shown as function
    args: Record<string, { valueSrc: ValueSource; value: any }>;
};
