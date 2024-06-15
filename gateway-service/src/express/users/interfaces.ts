import { IBaseUser } from '../../externalServices/userService/interfaces/users';

export type IExternalUserDigitalIdentity = Omit<IBaseUser, '_id' | 'preferences' | 'externalMetadata'>;

export interface IExternalUser {
    kartoffelId: string;
    digitalIdentities: {
        [source: string]: IExternalUserDigitalIdentity;
    };
}
