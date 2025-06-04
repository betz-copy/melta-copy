import { create } from 'zustand';
import { IKartoffelUser } from '../interfaces/users';
import { IEntity } from '../interfaces/entities';

export interface SimbaUserState {
    simbaUser: IKartoffelUser;
    simbaUserEntity: IEntity;
    setSimbaUser: (simbaUser: IKartoffelUser, simbaUserEntity: IEntity) => void;
}

export const useSimbaUserStore = create<SimbaUserState>((set) => ({
    simbaUser: {} as IKartoffelUser,
    simbaUserEntity: {} as IEntity,
    setSimbaUser: (simbaUser, simbaUserEntity) => set({ simbaUser, simbaUserEntity }),
}));
