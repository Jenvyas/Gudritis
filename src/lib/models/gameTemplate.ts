import { collections } from "../../hooks.server";

export const gameTemplates = collections.gameTemplates;

export interface Answer {
    index: number;
    text: string;
}

export interface Slide {
    duration: number;
    text?: string;
    image?: string; 
    isMultipleAnswer: boolean;
    answers: Array<Answer>;
    correctAnswer: Array<number>;
}

export interface StoredGameTemplate {
    _id?: string;
    name: string;
    tags: Array<string>;
    slides: Array<Slide>;
    author: string;
    author_id: string;
    created: Date;
    last_updated: Date;
    flagged: boolean;
    public: boolean;
}

export interface GameTemplate {
    name: string;
    tags: Array<string>;
    slides: Array<Slide>;
    author: string;
    author_id: string;
}