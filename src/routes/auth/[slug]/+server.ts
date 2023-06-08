import * as bcrypt from "bcrypt";
import * as EmailValidator from 'email-validator';
import { v4 as uuidv4 } from 'uuid';
import { users } from "$lib/db";
import type { User } from "$lib/models/user";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import type { WithId } from "mongodb";

export const POST: RequestHandler = async (event) => {
    const { slug } = event.params;

    let body;
    let user: WithId<User> | null | undefined ;

    try {
        switch(slug) {
            case 'login':
                body = await event.request.json();
                if (body.name && body.password) {
                    user = await users?.findOne({
                        $or: [
                            {username:body.name},
                            {email:body.name}
                        ]
                    });
                } else {
                    throw error(400, "Please supply all required fields")
                }

                if (user) {
                    bcrypt.compare(body.password, user.password);
                } else {
                    throw error(401, "Username/email is not valid or password is incorrect");
                }
            case 'register':
                if (!body.username || !body.email || !body.password || !body.nickname) {
                    throw error(400, 'Please supply all required fields: username, email, password, nickname.')
                }
                user = await users?.findOne({
                    $or: [
                        {username:body.username},
                        {email:body.email}
                    ]
                });
                if (user) {
                    throw error(422, "Username/Email is already taken");
                }
                if (body.password.length()<8) {
                    throw error(422, "Password is too short, must be at least 8 characters long");
                }
                if (!EmailValidator.validate(body.email)) {
                    throw error(422, "Invalid email provided");
                }
                const hashedPassword = await bcrypt.hash(body.password, 10);
                const registeredUser: User = {
                    _id: uuidv4(),
                    username: body.username,
                    email: body.email,
                    password: hashedPassword,
                    emailVerified: false,
                    nickname: body.nickname,
                    creationDate: new Date(),
                };
                await users?.insertOne(registeredUser);
        }
    } catch (err) {
        throw error(503, "Could not contact the database");
    }

    return json(
        {

        }
    );
} 