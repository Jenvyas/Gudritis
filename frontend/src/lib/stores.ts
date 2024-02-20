import { writable, type Writable } from "svelte/store";
import type { LoginSession } from "./models/session";

export const loginSession = <Writable<LoginSession>> writable(undefined)