import type { PageServerLoad } from './$types';

export const load = (async ({ cookies }) => {
    cookies.get('session');
}) satisfies PageServerLoad