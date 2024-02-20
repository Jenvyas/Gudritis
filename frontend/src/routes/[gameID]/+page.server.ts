import { activeGameSessions } from '../../hooks.server';
import type { PageServerLoad } from './$types';
import { redirect, type Actions } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';

export const ssr = false;

export const load = (async ({locals, params, cookies}) => {
    const {loginSession} = locals;

    const gameId = Number(params.gameID);

    if (isNaN(gameId)) {
        throw redirect(307, `/`);
    }
    const gameIndex = activeGameSessions.findIndex(i=>i.code===gameId);
    if (gameIndex===-1) {
        throw redirect(307, `/`);
    }

    const isHost = activeGameSessions[gameIndex].host===loginSession?._id;

    let SessionId: string | undefined = cookies.get("session");

    if (!loginSession) {
        SessionId = cookies.get("guest_session");
        if (!SessionId) {
            const code: string = uuidv4();
            cookies.set("guest_session", code);
            SessionId = code;
        }
    }

    return { gameId, isHost, SessionId };
}) satisfies PageServerLoad;