import { IBaseUser } from '../../externalServices/userService/interfaces/users';

export interface IExternalUserData {
    kartoffelId: string;
    digitalIdentities: {
        [source: string]: Omit<IBaseUser, '_id' | 'preferences' | 'externalMetadata'>;
    };
}
