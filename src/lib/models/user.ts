export interface User {
    _id: string;
    username: string;
    email?: string;
    emailVerified?: boolean;
    nickname: string;
    creationDate: Date;
    password: string;
}