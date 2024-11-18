import { Document } from "mongoose";

export interface ICategory {
  name: string;
  displayName: string;
  iconFileId: string | null;
  color: string;
}

export interface IMongoCategory extends ICategory, Document<string> {
  _id: string;
}
