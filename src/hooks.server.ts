import { DB_CONN_STRING, DB_NAME, GAMETEMPLATES_COLLECTION_NAME, USERS_COLLECTION_NAME, SESSIONS_COLLECTION_NAME, GAMESESSIONS_COLLECTION_NAME } from "$env/static/private";
import type { GameTemplate, StoredGameTemplate } from "./lib/models/gameTemplate";
import type { User } from './lib/models/user';
import type { Session } from './lib/models/session';
import * as mongoDB from "mongodb";
import type { Handle, RequestEvent } from '@sveltejs/kit';
import type { ActiveGameSession, GameSession } from "$lib/models/gameSession";
import { Server } from "socket.io";

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

export const db = await connectToDatabase();

async function attachUserToRequestEvent(sessionId: string, event: RequestEvent) {
    const session = await collections.sessions?.findOne({_id: sessionId});
    
    if (session) {
        const user = await collections.users?.findOne({_id: session.userId});
        
        if (user) {
            event.locals.loginSession = {...user, sessionExpiration: session.expirationDate};
        }
    }
}

export const handle: Handle = async ({event, resolve}) => {
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

