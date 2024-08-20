import config from '../../config/index';
import { IUser } from '../../interfaces/users';
import { IMongoCategory } from '../../templates/categories';
import { getPermissionsToCreate } from './permissions';

export const getUsersToCreate = (rootWorkspaceId: string, mainWorkspaceId: string, categories: IMongoCategory[]): Omit<IUser, '_id'>[] => {
    return config.usersService.managersKartoffelIds.map((kartoffelId) => {
        return {
            fullName: 'נייקי אדידס',
            mail: 'me@me.com',
            jobTitle: 'גיבור',
            hierarchy: 'מגניב/ביותר',
            preferences: {
                darkMode: true,
            },
            externalMetadata: {
                kartoffelId,
                digitalIdentitySource: 'es_name', // must match kartoffel mock source
            },
            permissions: getPermissionsToCreate(rootWorkspaceId, mainWorkspaceId, categories),
        };
    });
};
