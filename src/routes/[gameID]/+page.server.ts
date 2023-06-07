import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({params}) => {
    throw redirect(307, `/`);
}) satisfies PageServerLoad;