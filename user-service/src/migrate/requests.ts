import { ICompactPermissions, IUser } from '@microservices/shared';
import axios from 'axios';
import config from './config';
import { IPermissionsOfUser } from './old_interfaces';

export const getOldPermissionsOfUsers = async () => {
    const { data } = await axios.get<IPermissionsOfUser[]>(`${config.oldMeltaUrl}/api/permissions`, {
        headers: {
            Cookie: config.oldAuth,
        },
    });
    return data;
};

export const createNewUser = async (body: { kartoffelId: string; digitalIdentitySource: string; permissions: ICompactPermissions }) => {
    const { data } = await axios.post<IUser>(`${config.newMeltaUrl}/api/users`, body, {
        headers: {
            Cookie: config.newAuth,
        },
    });
    return data;
};
