import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { UserTypeId } from "@/config/architecture";
import {
	ACTIVE_BUYER_COOKIE,
	ACTIVE_BUYER_STORAGE_KEY,
	ACTIVE_BRANCH_COOKIE,
	ACTIVE_BRANCH_STORAGE_KEY,
	ACTIVE_DEALERSHIP_STORAGE_KEY,
	ACTIVE_DEALERSHIP_COOKIE,
	AUTH_TOKEN_COOKIE,
	AUTH_USER_TYPE_COOKIE,
	AUTH_USER_TYPE_STORAGE_KEY,
} from "@/features/authentication/constants";
import {
	isKnownUserType,
	resolveUserTypeFromSupabaseUser,
} from "@/features/authentication/user-type";

export interface OwnerSignUpInput {
	readonly email: string;
	readonly password: string;
	readonly fullName: string;
}

const LAST_PROTECTED_PATH_STORAGE_KEY = "surf4cars:last-protected-path";

function normalizeEmail(value: string | null | undefined): string {
	return (value ?? "").trim().toLowerCase();
}

function createEmailMismatchError(currentEmail: string, expectedEmail: string): Error {
	return new Error(
		`You are signed in as ${currentEmail}. Sign out and continue onboarding with ${expectedEmail}.`,
	);
}

/**
 * `Secure` is applied only when the page is served over HTTPS. Browsers reject Secure cookies on
 * plain HTTP, so attaching it unconditionally would silently break local development while making
 * no difference in production. Over HTTPS every session cookie is issued Secure.
 */
function cookieSecuritySuffix(): string {
	if (typeof location === "undefined") return "";
	return location.protocol === "https:" ? "; Secure" : "";
}

function writeCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 14): void {
	if (typeof document === "undefined") return;
	document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${cookieSecuritySuffix()}`;
}

function deleteCookie(name: string): void {
	if (typeof document === "undefined") return;
	document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${cookieSecuritySuffix()}`;
}

function readClientStoredUserType(): UserTypeId | null {
	if (typeof window === "undefined") return null;
	const stored = window.localStorage.getItem(AUTH_USER_TYPE_STORAGE_KEY);
	if (isKnownUserType(stored)) {
		return stored;
	}

	const hasActiveDealership = Boolean(window.localStorage.getItem(ACTIVE_DEALERSHIP_STORAGE_KEY));
	return hasActiveDealership ? "dealer-owner" : null;
}

function parseBearerToken(authHeader: string | null): string | undefined {
	if (!authHeader) return undefined;
	const [type, token] = authHeader.split(" ");
	if (type?.toLowerCase() !== "bearer" || !token) return undefined;
	return token;
}

function sanitizeRedirectPath(input: string | null | undefined): string | null {
	if (!input) return null;
	if (!input.startsWith("/")) return null;
	if (input.startsWith("//")) return null;
	return input;
}

function readClientStoredActiveDealershipId(): string | null {
	if (typeof window === "undefined") return null;
	const value = window.localStorage.getItem(ACTIVE_DEALERSHIP_STORAGE_KEY);
	return value?.trim() ? value : null;
}

function readClientStoredActiveBranchId(): string | null {
	if (typeof window === "undefined") return null;
	const value = window.localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY);
	return value?.trim() ? value : null;
}

function readClientStoredActiveBuyerId(): string | null {
	if (typeof window === "undefined") return null;
	const value = window.localStorage.getItem(ACTIVE_BUYER_STORAGE_KEY);
	return value?.trim() ? value : null;
}

export function resolveUserTypeFromSupabaseSession(session: {
	readonly user: {
		readonly user_metadata?: Record<string, unknown> | null;
		readonly app_metadata?: Record<string, unknown> | null;
	};
} | null): UserTypeId | null {
	if (!session) return null;
	return resolveUserTypeFromSupabaseUser(session.user);
}

export function setClientAuthUserType(userType: UserTypeId): void {
	if (typeof window !== "undefined") {
		window.localStorage.setItem(AUTH_USER_TYPE_STORAGE_KEY, userType);
	}
	writeCookie(AUTH_USER_TYPE_COOKIE, userType);
}

export function clearClientAuthState(): void {
	if (typeof window !== "undefined") {
		window.localStorage.removeItem(AUTH_USER_TYPE_STORAGE_KEY);
		window.localStorage.removeItem(ACTIVE_BUYER_STORAGE_KEY);
		window.localStorage.removeItem(ACTIVE_DEALERSHIP_STORAGE_KEY);
		window.localStorage.removeItem(ACTIVE_BRANCH_STORAGE_KEY);
	}
	deleteCookie(AUTH_TOKEN_COOKIE);
	deleteCookie(AUTH_USER_TYPE_COOKIE);
	deleteCookie(ACTIVE_BUYER_COOKIE);
	deleteCookie(ACTIVE_DEALERSHIP_COOKIE);
	deleteCookie(ACTIVE_BRANCH_COOKIE);
}

export function setClientActiveDealershipContext(input: {
	readonly dealershipId: string;
	readonly branchId?: string | null;
}): void {
	if (typeof window !== "undefined") {
		window.localStorage.setItem(ACTIVE_DEALERSHIP_STORAGE_KEY, input.dealershipId);
		if (input.branchId) {
			window.localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, input.branchId);
		}
	}

	writeCookie(ACTIVE_DEALERSHIP_COOKIE, input.dealershipId);
	if (input.branchId) {
		writeCookie(ACTIVE_BRANCH_COOKIE, input.branchId);
	}
}

export function setClientActiveBuyerContext(buyerId: string): void {
	if (typeof window !== "undefined") {
		window.localStorage.setItem(ACTIVE_BUYER_STORAGE_KEY, buyerId);
	}

	writeCookie(ACTIVE_BUYER_COOKIE, buyerId);
}

export function getClientActiveBuyerContext(): string | null {
	if (typeof window !== "undefined") {
		const storedBuyerId = window.localStorage.getItem(ACTIVE_BUYER_STORAGE_KEY);
		if (storedBuyerId?.trim()) {
			return storedBuyerId.trim();
		}
	}

	if (typeof document === "undefined") return null;

	const cookiePrefix = `${ACTIVE_BUYER_COOKIE}=`;
	const buyerCookie = document.cookie
		.split(";")
		.map((part) => part.trim())
		.find((part) => part.startsWith(cookiePrefix));

	if (!buyerCookie) return null;

	const decodedBuyerId = decodeURIComponent(buyerCookie.slice(cookiePrefix.length)).trim();
	return decodedBuyerId || null;
}

function syncClientDealershipContextFromStorage(): void {
	const dealershipId = readClientStoredActiveDealershipId();
	const branchId = readClientStoredActiveBranchId();

	if (dealershipId) {
		writeCookie(ACTIVE_DEALERSHIP_COOKIE, dealershipId);
	} else {
		deleteCookie(ACTIVE_DEALERSHIP_COOKIE);
	}

	if (branchId) {
		writeCookie(ACTIVE_BRANCH_COOKIE, branchId);
	} else {
		deleteCookie(ACTIVE_BRANCH_COOKIE);
	}
}

function syncClientBuyerContextFromStorage(): void {
	const buyerId = readClientStoredActiveBuyerId();

	if (buyerId) {
		writeCookie(ACTIVE_BUYER_COOKIE, buyerId);
	} else {
		deleteCookie(ACTIVE_BUYER_COOKIE);
	}
}

function syncClientAuthState(options: {
	readonly accessToken?: string | null;
	readonly userType?: UserTypeId | null;
}): void {
	if (options.accessToken) {
		writeCookie(AUTH_TOKEN_COOKIE, options.accessToken);
	} else {
		deleteCookie(AUTH_TOKEN_COOKIE);
	}

	if (options.userType) {
		setClientAuthUserType(options.userType);
	}
}

export function getAuthCookieNames() {
	return {
		authTokenCookie: AUTH_TOKEN_COOKIE,
		authUserTypeCookie: AUTH_USER_TYPE_COOKIE,
	};
}

export function parseAuthBearerToken(authHeader: string | null): string | undefined {
	return parseBearerToken(authHeader);
}

export function resolveSafeAuthRedirectPath(input: string | null | undefined, fallbackPath: string): string {
	return sanitizeRedirectPath(input) ?? fallbackPath;
}

export function rememberClientProtectedPath(path: string): void {
	if (typeof window === "undefined") return;
	const safePath = sanitizeRedirectPath(path);
	if (!safePath) return;
	window.localStorage.setItem(LAST_PROTECTED_PATH_STORAGE_KEY, safePath);
}

export function resolvePreferredClientAuthRedirectPath(
	portal: "buyer" | "dealer",
	input: string | null | undefined,
	fallbackPath: string,
): string {
	const resolved = resolveSafeAuthRedirectPath(input, fallbackPath);
	if (typeof window === "undefined") return resolved;

	const remembered = sanitizeRedirectPath(
		window.localStorage.getItem(LAST_PROTECTED_PATH_STORAGE_KEY),
	);
	if (!remembered) return resolved;

	if (portal === "dealer" && resolved === "/dealer" && remembered.startsWith("/dealer/")) {
		return remembered;
	}

	if (portal === "buyer" && resolved === "/buyer" && remembered.startsWith("/buyer/")) {
		return remembered;
	}

	return resolved;
}

export function syncClientSessionState(input: {
	readonly accessToken?: string | null;
	readonly userType?: UserTypeId | null;
} | null): void {
	if (!input) {
		clearClientAuthState();
		return;
	}

	syncClientAuthState(input);
	syncClientDealershipContextFromStorage();
	syncClientBuyerContextFromStorage();
}

export async function logoutCurrentSession(): Promise<void> {
	const supabase = createSupabaseBrowserClient();
	clearClientAuthState();

	if (supabase) {
		try {
			await supabase.auth.signOut();
		} catch {
			// Local session has already been cleared; ignore remote sign-out failures in fallback flows.
		}
	}
}

/**
 * Resolves an authenticated, verified owner session token for onboarding completion.
 * Returns undefined when Supabase is not configured (local fallback mode).
 */
export async function resolveOwnerOnboardingAccessToken(
	owner: OwnerSignUpInput,
): Promise<string | undefined> {
	const supabase = createSupabaseBrowserClient();
	if (!supabase) {
		syncClientSessionState({ userType: "dealer-owner" });
		return undefined;
	}

	const normalizedOwnerEmail = normalizeEmail(owner.email);
	const existing = await supabase.auth.getSession();
	let session = existing.data.session;

	if (session) {
		const sessionEmail = normalizeEmail(session.user.email);
		if (sessionEmail && sessionEmail !== normalizedOwnerEmail) {
			throw createEmailMismatchError(sessionEmail, normalizedOwnerEmail);
		}
	}

	if (!session) {
		const signUp = await supabase.auth.signUp({
			email: owner.email,
			password: owner.password,
			options: {
				data: {
					full_name: owner.fullName,
					user_type: "dealer-owner",
				},
			},
		});

		if (signUp.error) {
			if (process.env.NODE_ENV !== "production") {
				syncClientSessionState({ userType: "dealer-owner" });
				return undefined;
			}

			throw signUp.error;
		}

		session = signUp.data.session;
	}

	if (!session || !session.user.email_confirmed_at) {
		if (process.env.NODE_ENV !== "production") {
			syncClientSessionState({ userType: "dealer-owner" });
			return undefined;
		}

		throw new Error(
			"Check your inbox to verify your email, then sign in and complete onboarding.",
		);
	}

	const userType = resolveUserTypeFromSupabaseSession(session) ?? readClientStoredUserType() ?? "dealer-owner";
	syncClientSessionState({
		accessToken: session.access_token,
		userType,
	});

	return session.access_token;
}

/**
 * Merges headers with the current bearer token when available.
 */
export async function createAuthenticatedHeaders(headersInit?: HeadersInit): Promise<Headers> {
	const headers = new Headers(headersInit);
	const supabase = createSupabaseBrowserClient();
	const isProduction = process.env.NODE_ENV === "production";

	if (!supabase) {
		const fallbackUserType = readClientStoredUserType();
		if (fallbackUserType) {
			syncClientSessionState({ userType: fallbackUserType });
		} else {
			syncClientSessionState(null);
		}
		return headers;
	}

	const existing = await supabase.auth.getSession();
	const session = existing.data.session;
	const token = session?.access_token;
	const fallbackUserType = readClientStoredUserType();

	if (token) {
		headers.set("Authorization", `Bearer ${token}`);
	}

	const userType = resolveUserTypeFromSupabaseSession(session)
		?? fallbackUserType
		?? null;

	if (!session && !isProduction && fallbackUserType) {
		syncClientSessionState({ userType: fallbackUserType });
		return headers;
	}

	syncClientSessionState(session ? {
		accessToken: token ?? null,
		userType,
	} : null);

	return headers;
}
