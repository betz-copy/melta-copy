import { ITablesResults } from './excel';

export type IStepperDataMultipleUpdate =
    | {
          step: 'updateValues';
          data: Record<string, any>[];
      }
    | {
          step: 'preview';
          data: any;
      }
    | { step: 'results'; data: ITablesResults };
