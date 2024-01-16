import { IPermissionsCompact } from '../permissions/interface/permissionsFormatted';

export interface IUser {
    _id: string;
    externalId: string;
    fullName: string;
    preferences: {
        darkMode?: boolean;
        profilePictureId?: string;
    };
}
export interface IUserWithPermissions extends IUser {
    permissions: IPermissionsCompact;
}
