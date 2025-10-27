import { create } from 'zustand';
import { IEntity } from '../interfaces/entities';
import { IKartoffelUser } from '../interfaces/users';

export interface ClientSideUserState {
    clientSideUser: IKartoffelUser;
    clientSideUserEntity: IEntity;
    setClientSideUser: (clientSideUser: IKartoffelUser, clientSideUserEntity: IEntity) => void;
}

export const useClientSideUserStore = create<ClientSideUserState>((set) => ({
    clientSideUser: {} as IKartoffelUser,
    clientSideUserEntity: {} as IEntity,
    setClientSideUser: (clientSideUser, clientSideUserEntity) => set({ clientSideUser, clientSideUserEntity }),
}));
