import { IMongoStepInstance, IMongoStepInstancePopulated } from './stepInstance';

export type IGenericStep = Pick<IMongoStepInstance, '_id' | 'reviewers'>;
export type IGenericStepPopulated = Pick<IMongoStepInstancePopulated, '_id' | 'reviewers'>;
