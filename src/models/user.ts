export interface User {
    userId: string;
    name: string;
    email?: string;
    emailVerified: boolean;
    password: string;
}