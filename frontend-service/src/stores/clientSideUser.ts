import { IEntity, IKartoffelUser } from '@microservices/shared';
import { create } from 'zustand';

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
