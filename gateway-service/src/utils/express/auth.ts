import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import * as passport from 'passport';
import { Request, Response, NextFunction } from 'express';

export const initializePassport = (secret: string) => {
    passport.use(
        'jwt',
        new Strategy(
            {
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
