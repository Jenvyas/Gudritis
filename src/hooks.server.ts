import { DB_CONN_STRING, DB_NAME, GAMETEMPLATES_COLLECTION_NAME, USERS_COLLECTION_NAME, SESSIONS_COLLECTION_NAME } from "$env/static/private";
import type { GameTemplate } from "./lib/models/gameTemplate";
import type { User } from './lib/models/user';
import type { Session } from './lib/models/session';
import * as mongoDB from "mongodb";
import type { Handle, RequestEvent } from '@sveltejs/kit';

export const collections: { gameTemplates?: mongoDB.Collection<GameTemplate>, users?: mongoDB.Collection<User>, sessions?: mongoDB.Collection<Session> } = {}

export async function connectToDatabase() {
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(DB_CONN_STRING);

    await client.connect();

    const db: mongoDB.Db = client.db(DB_NAME);

    const gameTemplatesCollection: mongoDB.Collection<GameTemplate> = db.collection(GAMETEMPLATES_COLLECTION_NAME);

    const usersCollection: mongoDB.Collection<User> = db.collection(USERS_COLLECTION_NAME);

    const sessionsCollection: mongoDB.Collection<Session> = db.collection(SESSIONS_COLLECTION_NAME);

    collections.gameTemplates = gameTemplatesCollection;

    collections.users = usersCollection;

    collections.sessions = sessionsCollection;

    console.log(`Successfully connected to database: ${db.databaseName} and collections: ${gameTemplatesCollection.collectionName}, ${usersCollection.collectionName}`);

    return db;
}

export const db = await connectToDatabase();

async function attachUserToRequestEvent(sessionId: string, event: RequestEvent) {
    const session = await collections.sessions?.findOne({sessionId});
    if (session) {
        const user = await collections.users?.findOne({_id: session.userId});
        event.locals.user = user;
    }
}

export const handle: Handle = async ({event, resolve}) => {
    const { cookies } = event;
    const sessionId = cookies.get('session');

    if (sessionId) {
        await attachUserToRequestEvent(sessionId, event);
    }

    if (!event.locals.user) {
        cookies.delete('session');
    }

    const response = await resolve(event);
    return response;
}