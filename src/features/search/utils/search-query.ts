import type { VehicleSearchFilters, VehicleSearchQuery, VehicleSearchSortField } from "@/domain/vehicle";

import { interpretDescription } from "./interpret-description";

const SEARCH_PARAM_ALIASES = {
	query: ["query", "q"],
	make: ["make"],
	model: ["model"],
	variant: ["variant"],
	yearMin: ["yearMin", "year-min"],
	yearMax: ["yearMax", "year-max"],
	priceMinCents: ["priceMin", "price-min", "minPrice"],
	priceMaxCents: ["priceMax", "price-max", "maxPrice"],
	mileageMaxKm: ["mileageMax", "mileage-max", "maxMileage"],
	fuel: ["fuel"],
	transmission: ["transmission"],
	bodyType: ["bodyType", "body"],
	province: ["province"],
	city: ["city"],
	dealer: ["dealer"],
	colour: ["colour"],
	condition: ["condition"],
	driveType: ["driveType", "drive-type"],
	engineSize: ["engineSize", "engine-size"],
	dealershipId: ["dealershipId", "dealerId"],
	branchId: ["branchId"],
	featured: ["featured"],
	verified: ["verified"],
	sort: ["sort"],
	page: ["page"],
	pageSize: ["pageSize"],
} as const;

export interface SearchQueryState extends VehicleSearchFilters {
	readonly sort?: VehicleSearchSortField;
	readonly page?: number;
	readonly pageSize?: number;
	readonly city?: string;
	readonly dealer?: string;
	readonly colour?: string;
	readonly condition?: string;
	readonly driveType?: string;
	readonly engineSize?: string;
}

function getParamValue(input: URLSearchParams | Record<string, string | string[] | undefined>, names: readonly string[]): string | undefined {
	for (const name of names) {
		const value = input instanceof URLSearchParams ? input.get(name) : input[name];
		if (Array.isArray(value)) {
			const first = value.find((item) => item?.trim());
			if (first?.trim()) return first.trim();
			continue;
		}
		if (typeof value === "string" && value.trim()) {
			return value.trim();
		}
	}

	return undefined;
}

function parseOptionalNumber(value: string | undefined): number | undefined {
	if (!value) return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalBoolean(value: string | undefined): boolean | undefined {
	if (value === undefined) return undefined;
	if (["1", "true", "yes", "on"].includes(value.toLowerCase())) return true;
	if (["0", "false", "no", "off"].includes(value.toLowerCase())) return false;
	return undefined;
}

function parseSort(value: string | undefined): VehicleSearchSortField | undefined {
	switch (value) {
		case "relevance":
		case "price-asc":
		case "price-desc":
		case "year-desc":
		case "mileage-asc":
		case "listing-score":
		case "days-in-stock":
		case "views":
			return value;
		default:
			return undefined;
	}
}

export function parseSearchState(input: URLSearchParams | Record<string, string | string[] | undefined>): SearchQueryState {
	const query = getParamValue(input, SEARCH_PARAM_ALIASES.query);
	const make = getParamValue(input, SEARCH_PARAM_ALIASES.make);
	const model = getParamValue(input, SEARCH_PARAM_ALIASES.model);
	const variant = getParamValue(input, SEARCH_PARAM_ALIASES.variant);
	const yearMin = parseOptionalNumber(getParamValue(input, SEARCH_PARAM_ALIASES.yearMin));
	const yearMax = parseOptionalNumber(getParamValue(input, SEARCH_PARAM_ALIASES.yearMax));
	const priceMinCents = parseOptionalNumber(getParamValue(input, SEARCH_PARAM_ALIASES.priceMinCents));
	const priceMaxCents = parseOptionalNumber(getParamValue(input, SEARCH_PARAM_ALIASES.priceMaxCents));
	const mileageMaxKm = parseOptionalNumber(getParamValue(input, SEARCH_PARAM_ALIASES.mileageMaxKm));
	const fuel = getParamValue(input, SEARCH_PARAM_ALIASES.fuel);
	const transmission = getParamValue(input, SEARCH_PARAM_ALIASES.transmission);
	const bodyType = getParamValue(input, SEARCH_PARAM_ALIASES.bodyType);
	const province = getParamValue(input, SEARCH_PARAM_ALIASES.province);
	const city = getParamValue(input, SEARCH_PARAM_ALIASES.city);
	const dealer = getParamValue(input, SEARCH_PARAM_ALIASES.dealer);
	const colour = getParamValue(input, SEARCH_PARAM_ALIASES.colour);
	const condition = getParamValue(input, SEARCH_PARAM_ALIASES.condition);
	const driveType = getParamValue(input, SEARCH_PARAM_ALIASES.driveType);
	const engineSize = getParamValue(input, SEARCH_PARAM_ALIASES.engineSize);
	const dealershipId = getParamValue(input, SEARCH_PARAM_ALIASES.dealershipId);
	const branchId = getParamValue(input, SEARCH_PARAM_ALIASES.branchId);
	const featured = parseOptionalBoolean(getParamValue(input, SEARCH_PARAM_ALIASES.featured));
	const verified = parseOptionalBoolean(getParamValue(input, SEARCH_PARAM_ALIASES.verified));
	const sort = parseSort(getParamValue(input, SEARCH_PARAM_ALIASES.sort));
	const page = parseOptionalNumber(getParamValue(input, SEARCH_PARAM_ALIASES.page));
	const pageSize = parseOptionalNumber(getParamValue(input, SEARCH_PARAM_ALIASES.pageSize));

	/*
		A described search becomes a filtered one.
		=========================================
		Free text was matched as a single substring, so any sentence returned nothing — including the
		hero's own example chips. `interpretDescription` pulls the budget, body style, fuel, gearbox,
		province and mileage out of the phrase and leaves the rest as text.

		Explicit parameters always win. A URL that already carries `bodyType=SUV` is somebody's saved
		or shared link, and a sentence must never quietly overrule it.

		Only sentences are interpreted. One or two words are already a working literal search — "Toyota
		Hilux" returns nine cars — and putting that through the interpreter would strip it to nothing.
	*/
	const description = query && query.split(/\s+/).length >= 3 ? interpretDescription(query) : undefined;
	const derived = description?.interpreted ? description : undefined;

	return {
		query: derived ? derived.residual || undefined : query,
		make,
		model,
		variant,
		yearMin: yearMin ?? derived?.yearMin,
		yearMax,
		priceMinCents: priceMinCents ?? derived?.priceMinCents,
		priceMaxCents: priceMaxCents ?? derived?.priceMaxCents,
		mileageMaxKm: mileageMaxKm ?? derived?.mileageMaxKm,
		fuel: fuel ?? derived?.fuel,
		transmission: transmission ?? derived?.transmission,
		bodyType: bodyType ?? derived?.bodyType,
		province: province ?? derived?.province,
		city,
		dealer,
		colour,
		condition,
		driveType,
		engineSize,
		dealershipId,
		branchId,
		featured,
		verified,
		sort,
		page,
		pageSize,
	};
}

export function buildVehicleSearchQuery(state: SearchQueryState): VehicleSearchQuery {
	const queryText = [state.query, state.city, state.dealer, state.colour, state.condition, state.driveType, state.engineSize]
		.filter((value): value is string => Boolean(value?.trim()))
		.join(" ");

	return {
		filters: {
			query: queryText || undefined,
			make: state.make,
			model: state.model,
			variant: state.variant,
			yearMin: state.yearMin,
			yearMax: state.yearMax,
			priceMinCents: state.priceMinCents,
			priceMaxCents: state.priceMaxCents,
			mileageMaxKm: state.mileageMaxKm,
			fuel: state.fuel,
			transmission: state.transmission,
			bodyType: state.bodyType,
			province: state.province,
			dealershipId: state.dealershipId,
			branchId: state.branchId,
			featured: state.featured,
			verified: state.verified,
		},
		sort: state.sort,
		page: state.page,
		pageSize: state.pageSize,
	};
}

export function serializeSearchState(state: SearchQueryState): string {
	const params = new URLSearchParams();
	if (state.query) params.set("query", state.query);
	if (state.make) params.set("make", state.make);
	if (state.model) params.set("model", state.model);
	if (state.variant) params.set("variant", state.variant);
	if (state.yearMin !== undefined) params.set("yearMin", String(state.yearMin));
	if (state.yearMax !== undefined) params.set("yearMax", String(state.yearMax));
	if (state.priceMinCents !== undefined) params.set("priceMin", String(state.priceMinCents));
	if (state.priceMaxCents !== undefined) params.set("priceMax", String(state.priceMaxCents));
	if (state.mileageMaxKm !== undefined) params.set("mileageMax", String(state.mileageMaxKm));
	if (state.fuel) params.set("fuel", state.fuel);
	if (state.transmission) params.set("transmission", state.transmission);
	if (state.bodyType) params.set("bodyType", state.bodyType);
	if (state.province) params.set("province", state.province);
	if (state.city) params.set("city", state.city);
	if (state.dealer) params.set("dealer", state.dealer);
	if (state.colour) params.set("colour", state.colour);
	if (state.condition) params.set("condition", state.condition);
	if (state.driveType) params.set("driveType", state.driveType);
	if (state.engineSize) params.set("engineSize", state.engineSize);
	if (state.dealershipId) params.set("dealershipId", state.dealershipId);
	if (state.branchId) params.set("branchId", state.branchId);
	if (state.featured !== undefined) params.set("featured", String(state.featured));
	if (state.verified !== undefined) params.set("verified", String(state.verified));
	if (state.sort) params.set("sort", state.sort);
	if (state.page && state.page > 1) params.set("page", String(state.page));
	if (state.pageSize && state.pageSize !== 24) params.set("pageSize", String(state.pageSize));

	const queryString = params.toString();
	return queryString ? `?${queryString}` : "";
}