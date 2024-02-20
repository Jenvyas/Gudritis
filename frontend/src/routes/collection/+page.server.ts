import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { gameTemplates, type StoredGameTemplate } from "$lib/models/gameTemplate";

export const load: PageServerLoad = async ({ locals }) => {
    const {loginSession} = locals;
    if (!loginSession) {
        throw redirect(302, '/user/login');
    }
    const templates: Array<StoredGameTemplate> | null | undefined = await gameTemplates?.find({author_id: loginSession._id}).toArray();
    
    return { templates };
}