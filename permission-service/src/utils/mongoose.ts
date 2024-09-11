/* eslint-disable import/prefer-default-export */

import { BadRequestError } from "../express/error";
import { Document } from "mongoose";

export const handleMongooseDuplicateKeyError = (
  error: any,
  _doc: Document,
  next: (err?: any) => void
) => {
  if (error.name === "MongoError" && error.code === 11000) {
    next(
      new BadRequestError(
        "permission with the same resourceType, userId and category already exists"
      )
    );
  } else {
    next(error);
  }
};
