import { IUser } from './index';

declare module 'express-serve-static-core' {
    interface Request {
        user?: IUser;
    }
}

export {};
