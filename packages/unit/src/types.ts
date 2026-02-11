import { IMongoProps } from '@packages/common';

export interface IUnit {
    name: string;
    parentId?: string;
    workspaceId: string;
    disabled: boolean;
    depth: number;
}

export interface IMongoUnit extends IUnit, IMongoProps {}

export interface IUnitHierarchy extends IMongoUnit {
    children: IUnitHierarchy[];
}

export type IGetUnits = (IMongoUnit & { path: string })[];
