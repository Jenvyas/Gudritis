import type { StoredGameTemplate } from "./gameTemplate";
import { collections } from "../../hooks.server";

export const gameSessions = collections.gameSessions;

export interface Player {
    registered_player: boolean;
    user_id: string;
    nickname: string;
}

export interface PlayerAnswer { 
    question_index: number;
    answers: Array<number>;
    time: number;
}

export interface GameSession {
    _id: string;
    code: number;
    active: boolean;
    host: string;
    players: Array<Player>;
    template: StoredGameTemplate;
    player_answers: Array<PlayerAnswer>;
}

export interface ActiveGameSession {
    _id: string;
    started: false;
    finished: false;
    code: number;
    active: boolean;
    host: string;
    players: Array<Player>;
    template: StoredGameTemplate;
    player_answers: Array<PlayerAnswer>;
    current_questions: Map<string,number>; // player_id to the index of the question they're currently answering.
}