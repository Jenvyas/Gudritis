import { sessions } from "./db";

export async function checkSession(sessionId: string, userId: string): Promise<boolean> {
    return true;
};