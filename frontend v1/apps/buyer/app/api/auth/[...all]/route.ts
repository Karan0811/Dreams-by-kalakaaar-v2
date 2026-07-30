import { auth } from "@dbk/auth/server";
import { toNextJsHandler } from "better-auth/next-js";

/** Mounts the shared Better Auth instance at /api/auth/*; every auth action
 * (sign in, sign up, session, sign out, password reset) flows through here. */
export const { GET, POST } = toNextJsHandler(auth);
