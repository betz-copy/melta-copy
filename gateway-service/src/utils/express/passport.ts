import * as passport from 'passport';
import * as jwt from 'jsonwebtoken';
import { Strategy } from 'passport-shraga';
import { Strategy as JWTStrategy, VerifiedCallback } from 'passport-jwt';

import { Request } from 'express';
import config from '../../config/index';

const { shragaURL, callbackURL, useEnrichId, shragaTokenSecret, accessTokenName, tokenSecret } = config.authentication;

const serialize = (user: any, done: (err?: Error, id?: string) => void) => {
    done(undefined, jwt.sign({ ...user }, shragaTokenSecret));
};

const deserialize = (token: string, done: (err?: Error, user?: any) => void) => {
    done(undefined, jwt.decode(token));
};

export const initPassport = () => {
    passport.serializeUser(serialize);
    passport.deserializeUser(deserialize);

    passport.use(
        'jwt',
        new JWTStrategy(
            {
                jwtFromRequest: (req: Request) => {
                    return req.cookies[accessTokenName] || null;
                },
                secretOrKey: tokenSecret,
            },
            (payload: any, next: VerifiedCallback) => {
                if (payload) {
                    return next(null, payload);
                }
                return next(null, false);
            },
        ),
    );

    passport.use(
        new Strategy({ shragaURL, callbackURL, useEnrichId }, (user: any, next: any) => {
            next(null, user);
        }),
    );
};

export interface ShragaUser {
    id: string;
    adfsId: string;
    genesisId: string;
    name: { firstName: string; lastName: string };
    displayName: string;
    provider: 'Genesis' | string;
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
