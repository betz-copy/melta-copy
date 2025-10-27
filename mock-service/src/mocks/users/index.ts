import { IMongoCategory, IUser } from '@microservices/shared';
import config from '../../config/index';
import { getPermissionsToCreate } from './permissions';

const getUsersToCreate = (rootWorkspaceId: string, mainWorkspaceId: string, categories: IMongoCategory[]): Omit<IUser, '_id'>[] => {
    return config.usersService.managersKartoffelIds.map((kartoffelId) => {
        return {
            displayName: 'נייקי אדידס',
            fullName: 'נייקי אדידס',
            mail: 'me@me.com',
            jobTitle: 'גיבור',
            hierarchy: 'מגניב/ביותר',
            preferences: {
                darkMode: false,
            },
            kartoffelId,
            permissions: getPermissionsToCreate(rootWorkspaceId, mainWorkspaceId, categories),
        };
    });
};

export default getUsersToCreate;
