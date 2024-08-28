import axios from 'axios';
import { ICompactPermissions } from '../express/permissions/interface/permissions';
import { IUser } from '../express/users/interface';
import { config } from './config';
import { IPermissionsOfUser } from './old_interfaces';

export const getOldPermissionsOfUsers = async () => {
    const { data } = await axios.get<IPermissionsOfUser[]>(`${config.oldMeltaUrl}/api/permissions`, {
        headers: {
            Authorization: config.bearerToken,
        },
    });
    return data;
};

export const createNewUser = async (body: { kartoffelId: string; digitalIdentitySource: string; permissions: ICompactPermissions }) => {
    const { data } = await axios.post<IUser>(`${config.newMeltaUrl}/api/users`, body, {
        headers: {
            Authorization: config.bearerToken,
        },
    });
    return data;
};
