import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { gameTemplates, type StoredGameTemplate } from "$lib/models/gameTemplate";

export const load: PageServerLoad = async ({ locals }) => {
    const {loginSession} = locals;
    if (!loginSession) {
        throw redirect(302, '/user/login');
    }

    let templates: Array<StoredGameTemplate> | null | undefined;

    if (loginSession.role === "user") {
        templates = await gameTemplates?.find({public: true, flagged: false}).toArray();
    }

    if (loginSession.role === "admin") {
        templates = await gameTemplates?.find().toArray();
    }
    
    return { templates };
}