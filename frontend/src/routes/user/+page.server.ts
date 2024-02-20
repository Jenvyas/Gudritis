import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.loginSession) {
        
    } else {
        throw redirect(307, 'user/login');
    }
} 