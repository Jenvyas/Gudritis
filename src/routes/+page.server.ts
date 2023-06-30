import { redirect, type Actions, fail } from "@sveltejs/kit";
import { activeGameSessions } from "../hooks.server";

export const actions = {
    joinGame: async ({request}) => {
        const data = await request.formData();
        const code = Number(data.get('code'));
        let index = activeGameSessions.findIndex(i=>i.code===code);
        if (index===-1) {
            return fail(400, {code, noGame: true});
        } else{
            throw redirect(302,`/${code}`);
        }
    }
} satisfies Actions;