import { UsersModel } from './model';

export class UsersManager {
    static async getUserById(id: string) {
        return UsersModel.findById(id).lean().exec();
    }
}
