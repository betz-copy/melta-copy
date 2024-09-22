import { IUserSearchBody } from "../users/intefaces/users";

export class UserService {
  static async searchUserIds(searchBody: IUserSearchBody): Promise<string[]> {
    return UserService.searchUserIds(searchBody);
  }
}
