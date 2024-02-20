import { collections } from '../../hooks.server';

export const users = collections.users;

export interface User {
    _id: string;
    username: string;
    email?: string;
    emailVerified?: boolean;
    nickname: string;
    role: string;
    creationDate: Date;
    password: string;
}




