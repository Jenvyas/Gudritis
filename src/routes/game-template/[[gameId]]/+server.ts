import { gameTemplates, type GameTemplate } from "$lib/models/gameTemplate";
import type { RequestHandler } from "@sveltejs/kit";
import { v4 as uuidv4 } from 'uuid';
import { error, json } from "@sveltejs/kit";
import type { WithId } from "mongodb";
import { slideValidate, type SlideError } from "$lib/validation/templateValidation";



interface ValidationResult {
    statusCode: number,
    message: string,
    errors: Array<App.Error | SlideError>
}

export const PUT: RequestHandler = async (event) => {
    const { gameId } = event.params;

    const template: WithId<GameTemplate> = await event.request.json();

    const session = event.locals.loginSession;

    return json(
        {
            message: ""
        },
        {
            headers: {}
        }
    );
}

export const POST: RequestHandler = async (event) => {
    const template: GameTemplate = await event.request.json();

    const session = event.locals.loginSession;

    if (!session?._id) {
        throw error(401, "No user found");
    }

    if (template.author_id === "") {
        throw error(401, "No user provided");
    }

    if (template.author_id !== session._id) {
        throw error(401, "Template author does not match user session");
    }

    const validationResult = validateTemplate(template);

    if (validationResult.statusCode !== 200) {
        return json(
            {
                message: validationResult.message,
                errors: validationResult.errors,
            },
            {
                status: validationResult.statusCode,
            }
        );
    }

    const templateId = uuidv4();

    try {
        await gameTemplates?.insertOne(
            {
                _id: templateId,
                ...template
            }
        );
    } catch (err) {
        throw error(503, "There was a problem while contacting the database");
    }

    return json(
        {
            message: "Template succesfully created",
            templateId,
        },
        {
            status: 200,
        }
    );
}

const validateTemplate = (template: GameTemplate): ValidationResult => {
    let validationResult: ValidationResult = {
        statusCode: 200,
        message: "Created game template successfully.",
        errors: [],
    }

    if (template.name === "") {
        validationResult.statusCode = 400;
        validationResult.errors = [...validationResult.errors, {code:"NO_NAME", message: "Game Template must have a name"}];
    }

    if (template.name.length > 24) {
        validationResult.statusCode = 400;
        validationResult.errors = [...validationResult.errors, {code:"MAX_NAME", message: "Game Template name cannot exceed 24 characters"}];
    }

    if (template.slides.length === 0) {
        validationResult.statusCode = 400;
        validationResult.errors = [...validationResult.errors, {code:"NO_SLIDES", message: "Game Template must have at least 1 slide"}];
    }

    const invalidSlides: Array<SlideError> = template.slides.reduce(slideValidate, [] as Array<SlideError>);

    validationResult.errors = [...validationResult.errors, ...invalidSlides];

    if (validationResult.errors.length!==0) {
        validationResult.statusCode = 400;
        validationResult.message = "Submitted template was not valid";
    }

    return validationResult;
}
