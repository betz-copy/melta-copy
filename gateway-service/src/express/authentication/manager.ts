import jwt from 'jsonwebtoken';
import config from '../../config';
import { IConnectedUser } from '../../utils/express/passport';

const { tokenSecret, accessTokenExpirationTime } = config.authentication.shragaAuthentication;

export class AuthenticationManager {
    static createAccessToken(payload: IConnectedUser): string {
        return jwt.sign(payload, tokenSecret, { expiresIn: accessTokenExpirationTime as any });
    }
}

export default AuthenticationManager;
