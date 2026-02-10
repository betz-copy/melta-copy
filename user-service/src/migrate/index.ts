import { ICompactPermissions, ISubCompactPermissions, PermissionScope } from '@packages/permission';
import { logger } from '@packages/utils';
import { isAxiosError } from 'axios';
import config from './config';
import { IPermissionsOfUser } from './old_interfaces';
import { createNewUser, getOldPermissionsOfUsers } from './requests';

const oldPermissionsToNewPermissions = (
    oldPermissions: IPermissionsOfUser[],
): { kartoffelId: string; digitalIdentitySource: string; permissions: ICompactPermissions }[] => {
    return oldPermissions.map((oldPermissionOfUser) => {
        const newPermissions: ISubCompactPermissions = {};

        if (oldPermissionOfUser.permissionsManagementId) newPermissions.permissions = { scope: PermissionScope.write };
        if (oldPermissionOfUser.rulesManagementId) newPermissions.rules = { scope: PermissionScope.write };
        if (oldPermissionOfUser.processesManagementId) newPermissions.processes = { scope: PermissionScope.write };
        if (oldPermissionOfUser.templatesManagementId) newPermissions.templates = { scope: PermissionScope.write };

        if (oldPermissionOfUser.instancesPermissions) {
            newPermissions.instances = {
                categories: Object.fromEntries(
                    oldPermissionOfUser.instancesPermissions.map((oldInstancePermission) => [
                        oldInstancePermission.category, // TODO check wtf is 'All'
                        { entityTemplates: {}, scope: oldInstancePermission.scopes.includes('Write') ? PermissionScope.write : PermissionScope.read },
                    ]),
                ),
                scope: undefined,
            };
        }

        return {
            kartoffelId: oldPermissionOfUser.user.id,
            digitalIdentitySource: oldPermissionOfUser.user.digitalIdentities[0]?.source,
            permissions: { [config.workspaceId]: newPermissions },
        };
    });
};

const main = async () => {
    const oldPermissionsOfUser = await getOldPermissionsOfUsers();

    await Promise.all(
        oldPermissionsToNewPermissions(oldPermissionsOfUser).map(async (createUserBody) =>
            createNewUser(createUserBody).catch((err) => {
                logger.error(`failed to convert user ${createUserBody.kartoffelId} with source ${createUserBody.digitalIdentitySource} `, {
                    error: isAxiosError(err) ? err.response?.data : err,
                });
            }),
        ),
    );
};

main().catch((error) => logger.error('Main error: ', { error }));
