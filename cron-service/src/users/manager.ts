import { UserService } from "../ services/user";
import { IUserSearchBody } from "./intefaces/users";

export class UsersManager {
  static async searchUserIds(searchBody: IUserSearchBody): Promise<string[]> {
    return UserService.searchUserIds(searchBody);
  }
}
