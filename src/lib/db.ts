import { collections } from "../hooks.server";

import type { User as UserModel } from "./models/user";

export const gameTemplates = collections.gameTemplates;

export const users = collections.users;

export const sessions = collections.sessions;

export type User = UserModel;