import { REDIS_CONN_STRING, DB_CONN_STRING, DB_NAME, WS_CONN_STRING, GAMETEMPLATES_COLLECTION_NAME, USERS_COLLECTION_NAME, SESSIONS_COLLECTION_NAME, GAMESESSIONS_COLLECTION_NAME } from "$env/static/private";
import type { GameTemplate, StoredGameTemplate } from "./lib/models/gameTemplate";
import { createClient } from "redis";
import type { User } from './lib/models/user';
import type { Session } from './lib/models/session';
import * as mongoDB from "mongodb";
import type { Handle, RequestEvent } from '@sveltejs/kit';
import type { ActiveGameSession, GameSession } from "$lib/models/gameSession";

export const collections: { gameTemplates?: mongoDB.Collection<StoredGameTemplate>, users?: mongoDB.Collection<User>, sessions?: mongoDB.Collection<Session>, gameSessions?: mongoDB.Collection<GameSession> } = {}

export async function connectToDatabase() {
    const client: mongoDB.MongoClient = new mongoDB.MongoClient(DB_CONN_STRING);

    await client.connect();

    const db: mongoDB.Db = client.db(DB_NAME);

    const gameTemplatesCollection: mongoDB.Collection<StoredGameTemplate> = db.collection(GAMETEMPLATES_COLLECTION_NAME);

    const usersCollection: mongoDB.Collection<User> = db.collection(USERS_COLLECTION_NAME);

    const sessionsCollection: mongoDB.Collection<Session> = db.collection(SESSIONS_COLLECTION_NAME);

    const gameSessionsCollection: mongoDB.Collection<GameSession> = db.collection(GAMESESSIONS_COLLECTION_NAME);

    collections.gameTemplates = gameTemplatesCollection;

    collections.users = usersCollection;

    collections.sessions = sessionsCollection;

    collections.gameSessions = gameSessionsCollection;

    console.log(`Successfully connected to database: ${db.databaseName} and collections: ${gameTemplatesCollection.collectionName}, ${usersCollection.collectionName}, ${sessionsCollection.collectionName}, ${gameSessionsCollection.collectionName}`);

    return db;
}

async function connectToRedis() {
    const client = await createClient({
        url: REDIS_CONN_STRING
    }).
        on('error', err => console.log('Redis client error', err))
        .connect();
    return client;
}

export const db = await connectToDatabase();

export const redis_client = await connectToRedis();

async function attachUserToRequestEvent(sessionId: string, event: RequestEvent) {
    const user_id = await redis_client.get(sessionId);
    const expire_time = await redis_client.expireTime(sessionId);
    const expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds()+expire_time);

    if (user_id) {
        const user = await collections.users?.findOne({ _id: user_id });

        if (user) {
            event.locals.loginSession = { ...user, sessionExpiration: expirationDate};
        }
    }
}

export const handle: Handle = async ({ event, resolve }) => {
    const { cookies } = event;
    const sessionId = cookies.get('session');

    if (sessionId) {
        await attachUserToRequestEvent(sessionId, event);
    }

    if (!event.locals.loginSession) {
        cookies.delete('session');
    }

    const response = await resolve(event);

    return response;
}

export const activeGameSessions: Array<ActiveGameSession> = [];

