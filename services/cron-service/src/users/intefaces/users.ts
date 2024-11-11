import { ISubCompactPermissions } from "./permissions/permissions";

export interface IUserSearchBody {
  search?: string;
  permissions?: ISubCompactPermissions;
  workspaceIds?: string[];
  limit: number;
  step?: number;
}
