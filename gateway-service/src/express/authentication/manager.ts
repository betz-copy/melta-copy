import jwt from 'jsonwebtoken';
import config from '../../config';

const { tokenSecret, accessTokenExpirationTime } = config.authentication;

export class AuthenticationManager {
    static createAccessToken(payload: object): { token?: string; reason?: string } {
        return { token: jwt.sign({ ...payload }, tokenSecret, { expiresIn: accessTokenExpirationTime }) };
    }
}

export default AuthenticationManager;
