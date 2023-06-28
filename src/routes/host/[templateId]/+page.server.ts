import type { PageServerLoad } from "./$types";
import { gameTemplates, type StoredGameTemplate } from "$lib/models/gameTemplate";
import { error, redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ locals, params }) => {
    const {loginSession} = locals;

    if (!loginSession) {
        throw redirect(302, '/user/login');
    }

    const templateId = params.templateId;

    let template: StoredGameTemplate | null | undefined;

    try {
        template = await gameTemplates?.findOne({_id: templateId});
    } catch (err) {
        console.log(err);
        throw error(503, "Could not contact the database");
    }

    if (!template) {
        throw error(404, "Template not found");
    }

    if (loginSession.role !== "admin" && !template.public) {
        if (template.author_id !== loginSession._id) {
            throw error(404, "Template not found");
        }
    }
    
    return { template };
}