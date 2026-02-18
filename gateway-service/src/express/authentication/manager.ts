import { IReqUser } from '@packages/user';
import jwt from 'jsonwebtoken';
import { StringValue } from 'ms';
import config from '../../config';

const { tokenSecret, accessTokenExpirationTime } = config.authentication.shragaAuthentication;

export class AuthenticationManager {
    static createAccessToken(payload: IReqUser): string {
        return jwt.sign(payload, tokenSecret, { expiresIn: accessTokenExpirationTime as StringValue | number });
    }
}

export default AuthenticationManager;
