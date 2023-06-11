import type { LoginSession } from '$lib/models/session';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
    const { loginSession } = locals;
    const loginSessionData: LoginSession | null | undefined = loginSession;
    return {
        loginSessionData,
    }
}) satisfies LayoutServerLoad