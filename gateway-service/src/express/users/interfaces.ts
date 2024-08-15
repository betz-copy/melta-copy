import { IUser } from '../../externalServices/userService/interfaces/users';

export type IExternalUserDigitalIdentity = Pick<IUser, 'fullName' | 'mail' | 'jobTitle' | 'hierarchy' | 'displayName'>;

export interface IExternalUser {
    kartoffelId: string;
    digitalIdentities: {
        [source: string]: IExternalUserDigitalIdentity;
    };
}
