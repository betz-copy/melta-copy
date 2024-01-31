import mongoose from 'mongoose';

// https://github.com/Automattic/mongoose/issues/7150
export const AllowedEmptyString = mongoose.Schema.Types.String;
AllowedEmptyString.checkRequired((v) => v != null);
