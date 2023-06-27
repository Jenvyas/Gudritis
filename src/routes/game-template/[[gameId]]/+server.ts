import { gameTemplates, type GameTemplate, type StoredGameTemplate } from "$lib/models/gameTemplate";
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

interface TemplateRequest {
    _id?: string;
    amount?: number;
    start_from?: number;
    sort_by?: string;
}

export const GET: RequestHandler = async (event) => {
    const session = event.locals.loginSession;

    const req = event.request;

    const body: TemplateRequest = await req.json();

    let templates: Array<StoredGameTemplate> | null | undefined = [];

    if (body._id) {
        const template = await gameTemplates?.findOne({_id: body._id});
        if (!template || (template.public===false && (template.author_id!==session?._id))) {
            return json({
                message: "No template found",
                templates: [],
            })
        }
        templates.push(template);
    } else if (body.amount && body.start_from && body.sort_by) {
        if(body.amount>100){
            throw error(401, "Max templates per request: 100");
        }

        if (body.start_from && (body.start_from<0 || !Number.isInteger(body.start_from))) {
            throw error(401, "start_from has to be a positive integer");
        }

        switch (body.sort_by) {
            case "EDIT_DATE_DESC":
                templates = await gameTemplates?.find().sort({last_updated: -1}).skip(body.start_from || 0).limit(body.amount || 20).toArray();
                break;
            case "EDIT_DATE_ASC":
                templates = await gameTemplates?.find().sort({last_updated: 1}).skip(body.start_from || 0).limit(body.amount || 20).toArray();
                break;
            case "CREATE_DATE_DESC":
                templates = await gameTemplates?.find().sort({create: -1}).skip(body.start_from || 0).limit(body.amount || 20).toArray();
                break;
            case "CREATE_DATE_ASC":
                templates = await gameTemplates?.find().sort({create: 1}).skip(body.start_from || 0).limit(body.amount || 20).toArray();
                break;
            default:
                templates = await gameTemplates?.find().skip(body.start_from || 0).limit(body.amount || 20).toArray();
                break;
        }

    } else {
        throw error(401, "Bad request");
    }

    if(!templates) {
        return json({
            message: "No templates found",
            templates: []
        });
    }

    return json({
        message: "Templates were retrieved successfully",
        templates
    });
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

    if (template.author_id === "" || !template.author_id) {
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

    let createdTemplateId = uuidv4();

    try {
        await gameTemplates?.insertOne(
            {
                _id: createdTemplateId,
                flagged: false,
                created: new Date(),
                last_updated: new Date(),
                public: false,
                ...template
            }
        );
    } catch (err) {
        throw error(503, "There was a problem while contacting the database");
    }

    return json(
        {
            message: "Template succesfully created",
            template_id: createdTemplateId,
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

    if (template.name === "" || !template.name) {
        validationResult.statusCode = 400;
        validationResult.errors = [...validationResult.errors, {code:"NO_NAME", message: "Game Template must have a name"}];
    }

    if (template.name.length > 24 || template.name.length === undefined) {
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
