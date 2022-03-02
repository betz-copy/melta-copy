import * as assert from 'assert';
import PermissionModel from './model';
import { CheckAuthorizationBody, IPermission } from './interface';
import { ServiceError } from '../error';

export class PermissionsManager {
    static getPermissions(query: Partial<IPermission>) {
        return PermissionModel.find(query).exec();
    }

    static getPermissionById(id: string) {
        return PermissionModel.findById(id)
            .orFail(new ServiceError(404, `cannot find permission with id: ${id}`))
            .exec();
    }

    static async createPermission(permission: Omit<IPermission, 'id'>) {
        const { category, ...PermissionWithoutCategory } = permission;

        const allRelatedPermissions = await PermissionsManager.getPermissions(PermissionWithoutCategory);
        if (category === 'All') {
            if (allRelatedPermissions.length > 0) {
                throw new ServiceError(400, 'cant create permission for all categories because there is already specefic category permission');
            }
        } else if (PermissionsManager.doesPermissionsContainsAllCategoryPermission(allRelatedPermissions)) {
            throw new ServiceError(400, `Permission with the same settings already exists for all categories`);
        }

        return PermissionModel.create(permission);
    }

    static updatePermission(id: string, updatedPermission: Omit<IPermission, 'id' | 'userId' | 'category'>) {
        return PermissionModel.findOneAndUpdate({ _id: id }, updatedPermission, { new: true })
            .orFail(new ServiceError(404, `cannot find permission with id: ${id}`))
            .exec();
    }

    static deletePermission(id: string) {
        return PermissionModel.findByIdAndDelete(id)
            .orFail(new ServiceError(404, `cannot find permission with id: ${id}`))
            .exec();
    }

    static doesPermissionsContainsAllCategoryPermission = (permissions: IPermission[]) => {
        // TODO: get 'All' from config + all the places
        return permissions.some((permission) => permission.category === 'All');
    };

    static async checkUserAuthorization(userId: string, checkAuthorizationBody: CheckAuthorizationBody) {
        const { relatedCategories, operation, resourceType } = checkAuthorizationBody;

        const relevantPermissionsQuery = {
            userId,
            category: { $in: [...relatedCategories, 'All'] },
            resourceType,
            scopes: operation,
        };

        const relevantPermissions = await PermissionModel.find(relevantPermissionsQuery).exec();

        assert(relevantPermissions.length <= relatedCategories.length, `[BUG] - got 2 or more of the same permission for user ${userId}`);

        if (relevantPermissions.length === 0) {
            return {
                authorized: false,
                metadata: {
                    info: `cant find permissions with scope ${operation} on resource type ${resourceType} under categories ${relatedCategories} for user ${userId}`,
                },
            };
        }

        if (PermissionsManager.doesPermissionsContainsAllCategoryPermission(relevantPermissions)) {
            return {
                authorized: true,
                metadata: 'Operation permitted',
            };
        }

        if (relevantPermissions.length < relatedCategories.length) {
            return {
                authorized: false,
                metadata: {
                    info: `User ${userId} doesnt have permissions under all related categories: ${relatedCategories} on resource type ${resourceType} with scope ${operation}`,
                },
            };
        }

        return {
            authorized: true,
            metadata: 'Operation permitted',
        };
    }
}

export default PermissionsManager;
