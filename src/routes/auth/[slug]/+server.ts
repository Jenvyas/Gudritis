import * as bcrypt from "bcrypt";
import * as EmailValidator from 'email-validator';
import { v4 as uuidv4 } from 'uuid';
import { users } from "$lib/models/user";
import type { User } from "$lib/models/user";
import { sessions, type Session } from "$lib/models/session";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import type { WithId } from "mongodb";

interface AuthenticationResult {
    statusCode: number,
    message: string,
    user: User | undefined | null,
    session: Session | undefined | null
}

const authenticateLogin = async (requestBody: any): Promise<AuthenticationResult> => {
    let user: WithId<User> | null | undefined;
    if (requestBody.name && requestBody.password) {
        user = await users?.findOne({
            $or: [
                { username: requestBody.name },
                { email: requestBody.name }
            ]
        });
    } else {
        return {
            statusCode: 400,
            message: "Please supply all required fields",
            user: undefined,
            session: undefined
        }
    }
    
    if (!user) {
        return {
            statusCode: 401,
            message: "Username/email is not valid or password is incorrect",
            user: undefined,
            session: undefined
        }
    }

    if (!(await bcrypt.compare(requestBody.password, user.password))) {
        return {
            statusCode: 401,
            message: "Username/email is not valid or password is incorrect",
            user: undefined,
            session: undefined
        }
    }

    let authenticationResult: AuthenticationResult = {
        statusCode: 200,
        message: "Login successful",
        user,
        session: await createNewSession(user)
    }

    return authenticationResult;
}

const authenticateRegister = async (requestBody: any): Promise<AuthenticationResult> => {
    let user: WithId<User> | null | undefined;
    if (!requestBody.username || !requestBody.email || !requestBody.password || !requestBody.nickname) {
        return {
            statusCode: 400,
            message: "Please supply all required fields: username, email, password, nickname.",
            user: undefined,
            session: undefined
        }
    }

    if (!EmailValidator.validate(requestBody.email)) {
        return {
            statusCode: 422,
            message: "Invalid email provided",
            user: undefined,
            session: undefined
        }
    }

    user = await users?.findOne(
        { username: requestBody.username }
    );

    if (user) {
        return {
            statusCode: 422,
            message: "Username is already taken",
            user: undefined,
            session: undefined
        }
    }

    user = await users?.findOne(
        { email: requestBody.email }
    );

    if (user) {
        return {
            statusCode: 422,
            message: "Email is already taken",
            user: undefined,
            session: undefined
        }
    }

    if (requestBody.password.length < 8) {
        return {
            statusCode: 422,
            message: "Password is too short, must be at least 8 characters long",
            user: undefined,
            session: undefined
        }
    }

    const hashedPassword = await bcrypt.hash(requestBody.password, 10);
    const registeredUser: User = {
        _id: uuidv4(),
        username: requestBody.username,
        email: requestBody.email,
        password: hashedPassword,
        emailVerified: false,
        role: "user",
        nickname: requestBody.nickname,
        creationDate: new Date(),
    };

    console.log(registeredUser);


    await users?.insertOne(registeredUser);

    let authenticationResult: AuthenticationResult = {
        message: "Registration successful",
        user: registeredUser,
        statusCode: 200,
        session: await createNewSession(registeredUser),
    }
    return authenticationResult;
}

const createNewSession = async (user: User): Promise<Session> => {
    await sessions?.deleteMany({userId: user._id});
    
    const expirationDate = new Date();
    expirationDate.setHours(new Date().getHours() + 2);
    let newSession: Session = {
        _id: uuidv4(),
        userId: user._id,
        creationDate: new Date(),
        expirationDate: expirationDate,
    }
    await sessions?.insertOne(newSession);
    return newSession;
}

export const POST: RequestHandler = async (event) => {
    const { slug } = event.params;

    let body = await event.request.json();
    let authenticationResult: AuthenticationResult = {
        statusCode: 404,
        message: "",
        user: undefined,
        session: undefined
    };
    try {
        switch (slug) {
            case 'login':
                authenticationResult = await authenticateLogin(body);
                break;
            case 'register':
                authenticationResult = await authenticateRegister(body);
                break;
            case 'logout':
                if (event.locals.loginSession) {
                    await sessions?.deleteMany({ userId: event.locals.loginSession._id });
                }
                return json({ message: 'Logout successful.' }, {
					headers: {
						'Set-Cookie': `session=; Path=/; SameSite=Lax; HttpOnly; Expires=${new Date().toUTCString()}`
					}
				})
        }
    } catch (err) {
        if (err instanceof Error) {
            console.log(err.message);
        }
        throw error(503, "There was a problem while contacting the database");
    }


    if (!authenticationResult.user || !authenticationResult.session) {
        throw error(authenticationResult.statusCode, authenticationResult.message);
    }

    event.locals.loginSession = {
        ...authenticationResult.user,
        sessionExpiration: authenticationResult.session.expirationDate
    };

    return json(
        {
            message: authenticationResult.message,
            user: authenticationResult.user,
        },
        {
            headers: {
                'Set-Cookie': `session=${authenticationResult.session?._id}; Path=/; SameSite=Lax; HttpOnly; Max-Age=7200`
            }
        }
    );
} 