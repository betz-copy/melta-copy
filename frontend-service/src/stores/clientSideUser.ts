import { create } from 'zustand';
import { IKartoffelUser } from '../interfaces/users';
import { IEntity } from '../interfaces/entities';

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
