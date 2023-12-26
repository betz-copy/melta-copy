import { IMongoStepInstance } from './stepInstance';

export type IGenericStep = Pick<IMongoStepInstance, '_id' | 'reviewers'>;
