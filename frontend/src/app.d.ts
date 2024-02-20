// See https://kit.svelte.dev/docs/types#app

import type { LoginSession } from "$lib/models/session";
import type { User } from "./lib/models/user";



// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			code?: string;
			id?: string;
		}
		interface Locals {
			loginSession: LoginSession | null | undefined;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
