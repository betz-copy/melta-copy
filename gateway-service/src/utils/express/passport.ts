import { Strategy as ShragaStrategy } from '@yesodot/passport-shraga';
import { Request } from 'express';
import passport from 'passport';
import { BasicStrategy, BasicVerifyFunctionWithRequest } from 'passport-http';
import { Strategy as JWTStrategy, VerifiedCallback } from 'passport-jwt';
import config from '../../config/index';

const {
    shragaAuthentication: { shragaURL, callbackURL, useEnrichId, accessTokenName, tokenSecret },
    basicAuthentication: { users },
} = config.authentication;

export interface ShragaUser {
    id: string;
    adfsId: string;
    genesisId: string;
    name: { firstName: string; lastName: string };
    displayName: string;
    provider: 'Genesis' | 'ADFS';
    entityType: string;
    unit: string;
    dischargeDay: string;
    rank: string;
    job: string;
    phoneNumbers: string[];
    address: string;
    photo: any;
    RelayState?: string;
    exp: number;
    iat: number;
    jti: string;
}

export interface IConnectedUser {
    id: string;
    kartoffelId?: string;
    clientSideWorkspaceId?: string;
    usersInfoChildTemplateId?: string;
    clientSideWorkspaceName?: string;
}

const verifyAllowedUserBasicStrategy: BasicVerifyFunctionWithRequest = (_req, userId, password, done) => {
    const allowedUser = users.find((currUser) => currUser.userId === userId && currUser.password === password);

    if (!allowedUser) {
        done(null, false);
        return;
    }

    done(null, { id: userId } as IConnectedUser);
};

export const initPassport = () => {
    passport.use(
        'jwt',
        new JWTStrategy(
            {
                jwtFromRequest: (req: Request) => {
                    return req.cookies[accessTokenName] || null;
                },
                secretOrKey: tokenSecret,
            },
            (payload: IConnectedUser, next: VerifiedCallback) => {
                if (payload) {
                    return next(null, payload);
                }
                return next(null, false);
            },
        ),
    );

    passport.use(
        new ShragaStrategy({ shragaURL, callbackURL, useEnrichId }, (user: ShragaUser, next: any) => {
            next(null, user);
        }),
    );

    // by default BasicStrategy sends "www-authenticate" header with value 'Basic realm="User"',
    // which causes the browser to open login dialog with username & password.
    // see their original function here: https://github.com/jaredhanson/passport-http/blob/v0.3.0/lib/passport-http/strategies/basic.js#L106
    // override to simple 401 without the header
    // eslint-disable-next-line no-underscore-dangle
    (BasicStrategy.prototype as any)._challenge = () => 401;
    passport.use('basic', new BasicStrategy({ passReqToCallback: true }, verifyAllowedUserBasicStrategy));
};

declare global {
    // These declaration are merged into express's Request type
    // this extends @types/passport which extends @types/express
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        export interface User extends IConnectedUser {}
    }
}
