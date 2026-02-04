import jwt from 'jsonwebtoken';
import { StringValue } from 'ms';
import config from '../../config';
import { IConnectedUser } from '../../utils/express/passport';

const { tokenSecret, accessTokenExpirationTime } = config.authentication.shragaAuthentication;

export class AuthenticationManager {
    static createAccessToken(payload: IConnectedUser): string {
        return jwt.sign(payload, tokenSecret, { expiresIn: accessTokenExpirationTime as StringValue | number });
    }
}

export default AuthenticationManager;
