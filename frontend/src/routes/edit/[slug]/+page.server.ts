import { redirect } from "@sveltejs/kit";
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from "./$types";
import { gameTemplates, type StoredGameTemplate } from "$lib/models/gameTemplate";

export const load: PageServerLoad = async ({ locals, params }) => {
    const {loginSession} = locals;
    if (!loginSession) {
        throw redirect(302, '/user/login');
    }

    let gameId: string = params.slug;

    const template: StoredGameTemplate | null | undefined = await gameTemplates?.findOne({_id: gameId});    

    if (template?.author_id!==loginSession._id || !template) {
        throw error(404, {
            message: "Not found"
        })
    }
    
    return { template };
}