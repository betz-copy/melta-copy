import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt';
import * as passport from 'passport';
import { Request, Response, NextFunction } from 'express';

export const initializePassport = (secret: string) => {
    passport.use(
        'jwt',
        new Strategy(
            {
                jwtFromRequest: (req: Request) => {
                    return ExtractJwt.fromAuthHeaderAsBearerToken()(req) || (req.query.token as string) || null;
                },

                secretOrKey: secret,
            },
            (payload: any, next: VerifiedCallback) => {
                if (payload) {
                    return next(null, payload);
                }
                return next(null, false);
            },
        ),
    );

    return passport.initialize();
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (['/isAlive', '/isalive', '/health'].includes(req.path)) return next();
    return passport.authenticate('jwt', { session: false })(req, res, next);
};

interface ShragaUser {
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
    RelayState: string;
}

declare global {
    // These declaration are merged into express's Request type
    // this extends @types/passport which extends @types/express
    namespace Express {
        export interface User extends ShragaUser {}
    }
}
