import { collections } from "../../hooks.server";

export const sessions = collections.sessions;

export interface Session{
    _id: string;
    userId: string;
    creationDate: Date;
    expirationDate: Date;
}

interface LoginSessionData{
    _id: string;
    username: string;
    email?: string;
    emailVerified?: boolean;
    nickname: string;
    role: string;
    creationDate: Date;
    sessionExpiration: Date;
}

export type LoginSession = LoginSessionData | null | undefined;
