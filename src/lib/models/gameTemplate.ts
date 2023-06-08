interface Answer {
    index: number;
    text: string;
}

export interface Slide {
    index: number;
    duration: number;
    text?: string;
    image?: string; 
    isMultipleAnswer: boolean;
    answers: Array<Answer>;
    correctAnswer: Array<number>;
}

export interface GameTemplate {
    name: string;
    tags: string;
    slides: Array<Slide>;
    author: string;
}