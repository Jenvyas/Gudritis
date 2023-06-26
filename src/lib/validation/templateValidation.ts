import type { Slide } from "$lib/models/gameTemplate";

export interface SlideError {
    index: number;
    invalidQuestion?: {
        message: string
    };
    invalidAnswers: Array<{
        index:number,
        message: string
    }>;
    durationTooLong: boolean;
    durationTooShort: boolean;
    noCorrectAnswer: boolean;
    correctAnswerOutOfBounds: boolean;
    multipleCorrectOnSingleAnswer: boolean;
}

export const slideValidate = (invSlides: Array<SlideError>, slide: Slide, index: number) => {
    let slideErrors: SlideError = {
        index,
        invalidAnswers: [],
        noCorrectAnswer:false,
        durationTooLong: false,
        durationTooShort: false,
        correctAnswerOutOfBounds: false,
        multipleCorrectOnSingleAnswer: false,
    };

    if (slide.text) {
        if (slide.text === "") {
            slideErrors.invalidQuestion = { message: "Question text must be set" };
        }
        if (slide.text.length > 100) {
            slideErrors.invalidQuestion = { message: "Question cannot exceed 100 characters" };
        }
    }

    for (let i = 0; i < slide.answers.length; i++) {
        const answer = slide.answers[i];
        if (answer.text === "") {
            slideErrors.invalidAnswers.push({index: answer.index, message: "Answer text cannot be empty."});
            continue;
        }
        if (answer.text.length > 100) {
            slideErrors.invalidAnswers.push({index: answer.index, message: "Answer text cannot exceed 100 characters."});
            continue;
        }
    }

    if (slide.correctAnswer.length === 0) {
        slideErrors.noCorrectAnswer = true;
    }

    if (!slide.isMultipleAnswer && (slide.correctAnswer.length > 1)) {
        slideErrors.multipleCorrectOnSingleAnswer = true;
    }

    if (slide.duration > 120) {
        slideErrors.durationTooLong = true;
    }

    if (slide.duration <= 0) {
        slideErrors.durationTooShort = true;
    }

    for (let i = 0; i < slide.correctAnswer.length; i++) {
        if ( slide.correctAnswer[i] >= slide.answers.length || slide.correctAnswer[i] < 0 ) {
            slideErrors.correctAnswerOutOfBounds = true;
            break;
        }
    }

    if (slideErrors.correctAnswerOutOfBounds 
    || slideErrors.noCorrectAnswer 
    || (slideErrors.invalidAnswers.length !== 0)
    || slideErrors.invalidQuestion
    || slideErrors.durationTooShort
    || slideErrors.durationTooLong
    || slideErrors.multipleCorrectOnSingleAnswer) {
        return [...invSlides, slideErrors];
    }

    return invSlides;
}