import type { LayoutServerLoad } from './$types';
import { db } from '../hooks.server';
import { checkSession } from '$lib/session';

export const load = (async ({ cookies }) => {
    let sessionId = cookies.get('sessionId');
    let userId = cookies.get('userId');
    if (sessionId === undefined || userId === undefined) {
        return;
    }
    
    if (await checkSession(sessionId, userId)) {
        
    } else {

    }
}) satisfies LayoutServerLoad