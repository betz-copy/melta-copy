import { IGetUnits, IMongoUnit, IUnit, IUnitHierarchy } from '@packages/unit';
import mongoose, { FilterQuery } from 'mongoose';
import config from '../../config';
import UsersManager from '../users/manager';
import { CyclicalTreeError, DisabledChildUnderEnabledParent, UnitDoesNotExistError } from './errors';
import UnitsModel from './model';

const { unitsCollectionName } = config.mongo;

class UnitsManager {
    static async getUnits({
        workspaceIds,
        ...query
    }: FilterQuery<Partial<Omit<IUnit, 'workspaceId'>> & { workspaceIds?: string[] }>): Promise<IGetUnits> {
        if (workspaceIds) query.workspaceId = { $in: workspaceIds };

        const units = await UnitsModel.aggregate<IMongoUnit & { hierarchy: (IMongoUnit & { depth: number })[] }>([
            { $match: query },
            { $sort: { disabled: 1, name: 1 } },
            {
                $graphLookup: {
                    from: unitsCollectionName,
                    startWith: '$parentId',
                    connectFromField: 'parentId',
                    connectToField: '_id',
                    as: 'hierarchy',
                    depthField: 'depth',
                },
            },
        ]).exec();

        return units.map((unit) => {
            const { hierarchy, ...rest } = unit;

            return {
                ...rest,
                path: hierarchy
                    .sort((a, b) => b.depth - a.depth)
                    .map((unit) => unit.name)
                    .join('/'),
            };
        });
    }

    static async getUnit(id: string): Promise<IUnit> {
        return UnitsModel.findById(id).orFail(new UnitDoesNotExistError(id)).lean().exec();
    }

    static async getUnitsByIds(ids: string[]): Promise<IUnit[]> {
        return UnitsModel.find({ _id: { $in: ids } })
            .orFail(new UnitDoesNotExistError(ids.join(', ')))
            .lean()
            .exec();
    }

    static async createUnit(unit: IUnit): Promise<IUnit> {
        return UnitsModel.create(unit);
    }

    private static async isTreeCyclical(id: string, parentId?: string) {
        if (!parentId) return false;

        if (String(id) === String(parentId)) return true;

        const newParent = await UnitsManager.getUnit(parentId);

        return UnitsManager.isTreeCyclical(id, newParent.parentId);
    }

    static async updateUnit(id: string, update: Partial<IUnit>, shouldEffectChildren?: boolean): Promise<IUnit> {
        if (update.parentId) {
            const [parent, unitToUpdate] = await Promise.all([UnitsManager.getUnit(update.parentId), UnitsManager.getUnit(id)]);

            if (parent.disabled && !unitToUpdate.disabled) throw new DisabledChildUnderEnabledParent(id, update.parentId);

            if (await UnitsManager.isTreeCyclical(id, update.parentId)) throw new CyclicalTreeError(id, update.parentId);
        }

        if (update.disabled !== undefined && shouldEffectChildren) {
            const children = await UnitsModel.aggregate<IMongoUnit>([
                { $match: { _id: new mongoose.Types.ObjectId(id) } },
                {
                    $graphLookup: {
                        from: unitsCollectionName,
                        startWith: '$_id',
                        connectFromField: '_id',
                        connectToField: 'parentId',
                        as: 'children',
                    },
                },
                { $unwind: '$children' },
                { $replaceRoot: { newRoot: '$children' } },
            ]).exec();

            if (children.length) await UnitsModel.updateMany({ _id: children.map((unit) => unit._id) }, { disabled: update.disabled });
        }

        return UnitsModel.findByIdAndUpdate(id, update, { new: true }).orFail(new UnitDoesNotExistError(id)).lean().exec();
    }

    static sortUnitsByParentId(acc: IMongoUnit[], child: IMongoUnit, allUnits: IMongoUnit[]) {
        acc.push(child);

        const childrenOfChild = allUnits.filter(({ parentId }) => String(child._id) === String(parentId));

        if (!childrenOfChild.length) return;

        for (const childOfChild of childrenOfChild) {
            UnitsManager.sortUnitsByParentId(acc, childOfChild, allUnits);
        }
    }

    static nestTree(data: IUnitHierarchy[]) {
        let index = 0;

        const getChildren = (depth: number) => {
            const children: IUnitHierarchy[] = [];

            while (data[index]?.depth === depth) {
                index += 1;
                children.push({ ...data[index - 1], children: getChildren(depth + 1) });
            }

            return children;
        };

        return getChildren(0);
    }

    /**
     * Get the complete nested hierarchy of the user's units
     * @param workspaceId workspaceId of the units to get
     * @param userId userId to filter the units by.
     * @returns the nested units the user has a permission to see
     */
    static async getUnitHierarchy(workspaceId: IUnit['workspaceId'], userId: string): Promise<IUnitHierarchy[]> {
        const user = await UsersManager.getUserById(userId, [workspaceId], false, true);
        const userUnitIds = user.units?.[workspaceId]?.map((unitId) => new mongoose.Types.ObjectId(unitId)) || [];

        let units = await UnitsModel.aggregate<IUnitHierarchy>([
            {
                $match: {
                    workspaceId,
                    ...(!userUnitIds.length ? { parentId: null } : { _id: { $in: userUnitIds } }),
                },
            },
            {
                $graphLookup: {
                    from: unitsCollectionName,
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'parentId',
                    as: 'children',
                    depthField: 'depth',
                },
            },
            {
                $unwind: {
                    path: '$children',
                    preserveNullAndEmptyArrays: true,
                },
            },
            { $sort: { 'children.depth': 1, 'children.name': 1 } },
            {
                $group: {
                    _id: '$_id',
                    children: { $push: '$children' },
                    root: { $first: '$$ROOT' },
                },
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: ['$root', { children: '$children' }],
                    },
                },
            },
            { $sort: { disabled: 1, name: 1 } },
        ]);

        // Filter out units whose parent is also in the result set
        // This is for when the users unit have also a child and its parent (which is the same as having just the parent)
        if (userUnitIds.length) {
            const allChildrenIds = new Set(units.flatMap((unit) => [unit._id.toString(), ...unit.children.map((child) => child._id.toString())]));
            units = units.filter((unit) => !unit.parentId || !allChildrenIds.has(unit.parentId.toString()));
        }

        return units.map((unit) => {
            const acc: IUnitHierarchy['children'] = [];

            for (const child of unit.children) {
                if (child.depth === 0) UnitsManager.sortUnitsByParentId(acc, child, unit.children);
            }

            return UnitsManager.nestTree([{ ...unit, depth: 0 }, ...acc.map((acc) => ({ ...acc, depth: acc.depth + 1 }))])[0];
        });
    }
}

export default UnitsManager;
