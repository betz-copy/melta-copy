import { PermissionScope } from '../../interfaces/permissions';
import { ICompact, IInstancesPermission, InstancesSubclassesPermissions, ISubCompactPermissions } from '../../interfaces/permissions/permissions';

export const checkUserInstancePermission = (
    permission: InstancesSubclassesPermissions,
    permissions: ISubCompactPermissions,
    id: string,
    scope: PermissionScope,
): boolean => {
    return (
        Boolean(permissions?.admin) ||
        permissions?.instances?.[permission]?.[id]?.scope === scope ||
        permissions?.instances?.[permission]?.[id]?.scope === PermissionScope.write
    );
};

export const changeUserInstancePermission = (
    permission: InstancesSubclassesPermissions,
    permissions: ISubCompactPermissions,
    id: string,
    checked: boolean,
    scope: PermissionScope,
) => {
    const enumArray = Object.keys(InstancesSubclassesPermissions);
    const indexOfCheckedItem = enumArray.indexOf(permission);
    const newPermission = structuredClone(permissions?.instances) || {};

    console.log({ permissions }, { newPermission });

    newPermission[permission][id] = checked ? { scope: 'write' } : null;

    for (let enumArrayIndex = indexOfCheckedItem + 1; enumArrayIndex < enumArray.length; enumArrayIndex++) {
        console.log(enumArray[enumArrayIndex], newPermission?.[permission]);

        // const permissionIds = structuredClone(newPermission?.[enumArray[enumArrayIndex]]);
        // if ((scope = PermissionScope.read)) {
        //     delete newPermission?.[enumArray[enumArrayIndex]];
        // } else {

        // console.log({ permissionIds }, Array.from(permissionIds));

        // }
        console.log({ newPermission });
    }

    return enumArray;
};

export const changeGivenInstancePermission = (
    allPermissions: any,
    currentPermission: ISubCompactPermissions,
    permissionToChange: InstancesSubclassesPermissions,
    checked: boolean,
    id: string,
    scope: PermissionScope,
    parent?: { id: string; type: InstancesSubclassesPermissions },
) => {
    console.log({ currentPermission, checked });

    const newPermission = structuredClone(currentPermission?.instances) || {};

    if (checked) newPermission[permissionToChange] = { ...newPermission[permissionToChange], [id]: { scope } };
    else if (scope === PermissionScope.write && !(parent && newPermission[parent.type]?.[parent.id].scope === PermissionScope.read)) {
        console.log('cccccccccccccccccc', { ...newPermission[permissionToChange], [id]: { scope: PermissionScope.read } });

        newPermission[permissionToChange] = { ...newPermission[permissionToChange], [id]: { scope: PermissionScope.read } };
        // if (!(parent && newPermission[parent.type]?.[parent.id].scope === PermissionScope.read)) {
        //     newPermission[permissionToChange] = { ...newPermission[permissionToChange], [id]: { scope: PermissionScope.read } };
        // }
    } else {
        console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaa');
        console.log({ permissionToChange, id });

        delete newPermission[permissionToChange][id];
    }

    if (parent && !checked && newPermission?.[parent.type]?.[parent.id]?.scope === scope) {
        console.log('dddddddddddddddddddddd');
        console.log(newPermission[parent.type], scope);

        allPermissions.get(parent.id)?.[permissionToChange].forEach((permission) => {
            newPermission[permissionToChange] = {
                ...newPermission[permissionToChange],
                [permission.id]: { scope: newPermission[permissionToChange]?.[permission.id]?.scope || scope },
            };
        });
        if (scope === PermissionScope.write) {
            newPermission[permissionToChange] = { ...newPermission[permissionToChange], [id]: { scope: PermissionScope.read } };
            newPermission[parent.type] = { ...newPermission[parent.type], [parent.id]: { scope: PermissionScope.read } };
        } else {
            delete newPermission[parent.type][parent.id];
            delete newPermission[permissionToChange][id];
        }
    }

    const chosenTypePermissions = newPermission[permissionToChange];
    const checkParent =
        parent &&
        allPermissions.get(parent.id)?.[permissionToChange].every(
            // (prop) => chosenTypePermissions[prop.id]?.scope === scope || chosenTypePermissions[prop.id]?.scope === PermissionScope.write,
            (prop) => {
                console.log({ chosenTypePermissions });

                return chosenTypePermissions[prop.id];
            },
        );

    if (checkParent) {
        console.log('bbbbbbbbbbbbbbbbb');

        const checkWrite = allPermissions.get(parent.id)?.[permissionToChange].every(
            (prop) => {
                console.log(chosenTypePermissions[prop.id]?.scope);

                return chosenTypePermissions[prop.id]?.scope === PermissionScope.write;
            },
            // (prop) => chosenTypePermissions.includes(prop.id),
        );

        if (checkWrite) {
            console.log('write');

            newPermission[parent.type] = { ...newPermission[parent.type], [parent.id]: { scope: PermissionScope.write } };
            allPermissions.get(parent.id)?.[permissionToChange].forEach((permission) => {
                delete newPermission?.[permissionToChange]?.[permission.id];
            });
        } else {
            console.log('read');

            newPermission[parent.type] = { ...newPermission[parent.type], [parent.id]: { scope: PermissionScope.read } };
            allPermissions.get(parent.id)?.[permissionToChange].forEach((permission) => {
                if (newPermission[permissionToChange]?.[permission.id]?.scope === PermissionScope.read)
                    delete newPermission?.[permissionToChange]?.[permission.id];
            });
        }

        // allPermissions.get(parent.id)?.[permissionToChange].forEach((permission) => {
        //     if (scope === PermissionScope.read) {
        //         if (newPermission[permissionToChange]?.[permission.id]?.scope === PermissionScope.read)
        //             delete newPermission?.[permissionToChange]?.[permission.id];
        //     } else {
        //         delete newPermission?.[permissionToChange]?.[permission.id];
        //     }
        // });
    }

    return structuredClone(newPermission) || {};
};

export const clearChildPermissions = (
    allPermissionsToChange: any,
    currentPermission: ISubCompactPermissions,
    permissionToChange: InstancesSubclassesPermissions,
    id: string,
    scope: PermissionScope,
): any => {
    const newPermissions = structuredClone(currentPermission);
    console.log({ allPermissionsToChange, currentPermission, permissionToChange, id, scope });

    allPermissionsToChange.forEach((permission) => {
        if (newPermissions?.[permissionToChange]?.[permission.id]) {
            if (scope === PermissionScope.write) delete newPermissions?.[permissionToChange]?.[permission.id];
            else if (newPermissions?.[permissionToChange]?.[permission.id]?.scope === PermissionScope.read) {
                delete newPermissions[permissionToChange][permission.id];
            }
        }
    });

    console.log({ newPermissions });

    return newPermissions;
};

export const getUserPermissionScopeOfCategory = (categoriesPermissions: ICompact<IInstancesPermission>['categories'], categoryId: string) => {
    return categoriesPermissions[categoryId]?.scope ?? undefined;
};

export const getCategoryPermissionsToSyncAndDelete = (instances: ISubCompactPermissions['instances']) => {
    const categoryPermissionsToSync = {};
    const categoryPermissionsToDelete = {};

    if (!instances) return { categoryPermissionsToSync, categoryPermissionsToDelete };

    for (const [categoryId, categoryPermission] of Object.entries(instances.categories)) {
        (categoryPermission?.scope === null || categoryPermission?.scope === undefined ? categoryPermissionsToDelete : categoryPermissionsToSync)[
            categoryId
        ] = instances.categories[categoryId];
    }

    return { categoryPermissionsToSync, categoryPermissionsToDelete };
};
