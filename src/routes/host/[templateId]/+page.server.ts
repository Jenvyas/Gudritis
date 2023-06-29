import type { PageServerLoad } from "./$types";
import { gameTemplates, type StoredGameTemplate } from "$lib/models/gameTemplate";
import { error, redirect } from "@sveltejs/kit";
import { gameSessions, type ActiveGameSession } from "$lib/models/gameSession";
import { v4 as uuidv4 } from 'uuid';
import { activeGameSessions } from "../../../hooks.server";
import { goto } from "$app/navigation";
import { io } from "socket.io-client";

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

    function randomCode(): number {
        var minm = 10000;
        var maxm = 99999;
        return Math.floor(Math
        .random() * (maxm - minm + 1)) + minm;
    }

    let code: number=11111;
    let findingCode = true;

    while (findingCode) {
        code = randomCode();
        let index = activeGameSessions.findIndex(i=>i.code===code);
        if (index===-1) {
            findingCode=false;
            break;
        }
    }
    
    let gameSession: ActiveGameSession = {
        _id: uuidv4(),
        code,
        started: false,
        finished: false,
        active: true,
        host: loginSession._id,
        players: [],
        template,
        player_answers: [],
        current_questions: new Map<string, number>()
    }

    try {
        await gameSessions?.insertOne(gameSession);
    } catch (err) {
        throw error(503,"Couldn't contact the database");
    }

    activeGameSessions.push(gameSession);

    return{gameId: gameSession._id, gameTemplate: template, code: gameSession.code};

    //throw redirect(302,`/${code}`);
}