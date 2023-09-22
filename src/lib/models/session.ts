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
