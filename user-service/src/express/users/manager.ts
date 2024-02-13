import { IUser } from './interface';
import { UsersModel } from './model';

export class UsersManager {
    static async getUserById(id: string) {
        return UsersModel.findById(id).lean().exec();
    }

    static async updateUserPreferencesById(id: string, preferences: Partial<IUser['preferences']>) {
        return UsersModel.findByIdAndUpdate(id, { preferences }, { new: true }).lean().exec();
    }
}
