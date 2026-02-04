import { Date as Neo4jDate } from 'neo4j-driver';
import { IArgumentCauses } from './argument';
import { ICause } from './cause';

export interface IRegularFunctionCauses {
    arguments: IArgumentCauses[];
    // biome-ignore lint/suspicious/noExplicitAny: never doubt Noam
    resultValue: any;
}

export interface IGetTodayFunctionCause extends IRegularFunctionCauses {
    arguments: [];
    resultValue: Neo4jDate<number>;
}

export interface ICountAggFunctionCauses {
    causes: ICause[];
    resultValue: number;
}

export interface ISumAggFunctionCauses {
    causes: ICause[];
    resultValue: number;
}

export type IFunctionCauses = ICountAggFunctionCauses | ISumAggFunctionCauses | IRegularFunctionCauses;
