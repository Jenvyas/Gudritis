import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "../$types";

export const load: PageServerLoad = ({locals}) => {
    const {loginSession} = locals;
    if (loginSession) {
        throw redirect(302, '/user');
    }
    return {};
}