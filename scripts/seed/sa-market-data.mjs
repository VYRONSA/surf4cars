/**
 * South African market reference data for the PCP-001S1 seed framework.
 *
 * Model definitions carry the body/fuel/drive combinations and price bands that actually occur in
 * the SA market, so the generator cannot produce impossible vehicles (an electric double cab, a
 * Jimny priced like a Land Cruiser).
 */

export const CITIES = [
  { city: "Cape Town", province: "Western Cape", lat: -33.9249, lng: 18.4241, weight: 18 },
  { city: "Johannesburg", province: "Gauteng", lat: -26.2041, lng: 28.0473, weight: 22 },
  { city: "Pretoria", province: "Gauteng", lat: -25.7479, lng: 28.2293, weight: 12 },
  { city: "Durban", province: "KwaZulu-Natal", lat: -29.8587, lng: 31.0218, weight: 12 },
  { city: "Gqeberha", province: "Eastern Cape", lat: -33.9608, lng: 25.6022, weight: 7 },
  { city: "Bloemfontein", province: "Free State", lat: -29.0852, lng: 26.1596, weight: 5 },
  { city: "George", province: "Western Cape", lat: -33.9628, lng: 22.4614, weight: 4 },
  { city: "Polokwane", province: "Limpopo", lat: -23.9045, lng: 29.4689, weight: 5 },
  { city: "Mbombela", province: "Mpumalanga", lat: -25.4753, lng: 30.9694, weight: 4 },
  { city: "Kimberley", province: "Northern Cape", lat: -28.7282, lng: 24.7499, weight: 3 },
  { city: "East London", province: "Eastern Cape", lat: -33.0153, lng: 27.9116, weight: 4 },
];

export const SUBURBS = [
  "Claremont", "Sandton", "Menlyn", "Umhlanga", "Newton Park", "Westdene", "Blanco",
  "Bendor", "Riverside Park", "Royldene", "Vincent", "Century City", "Fourways",
  "Brooklyn", "Hillcrest", "Walmer", "Langenhoven Park",
];

/** Dealer archetypes drive both naming and which stock they carry. */
export const DEALER_TYPES = [
  { id: "franchise", label: "Franchise", weight: 30, inventory: [3, 15] },
  { id: "independent", label: "Independent", weight: 30, inventory: [3, 12] },
  { id: "commercial", label: "Commercial", weight: 15, inventory: [4, 14] },
  { id: "luxury", label: "Luxury", weight: 13, inventory: [3, 10] },
  { id: "budget", label: "Budget", weight: 12, inventory: [5, 15] },
];

const P = (min, max) => ({ min, max });

/**
 * priceNew is the indicative price band for a near-new example in ZAR.
 * Depreciation is applied per model year by the generator.
 */
export const MODELS = [
  // Toyota
  { make: "Toyota", model: "Hilux", variants: ["2.4 GD-6 SR", "2.8 GD-6 Raider", "2.8 GD-6 Legend RS"], body: "Double Cab", fuels: ["Diesel"], drives: ["RWD", "4x4"], trans: ["Manual", "Automatic"], price: P(480000, 1050000), segments: ["commercial", "franchise", "independent"] },
  { make: "Toyota", model: "Fortuner", variants: ["2.4 GD-6", "2.8 GD-6 VX"], body: "SUV", fuels: ["Diesel"], drives: ["RWD", "4x4"], trans: ["Automatic"], price: P(620000, 1120000), segments: ["franchise", "independent", "commercial"] },
  { make: "Toyota", model: "Corolla Cross", variants: ["1.8 Xi", "1.8 XS", "1.8 Hybrid XS"], body: "SUV", fuels: ["Petrol", "Hybrid"], drives: ["FWD"], trans: ["Automatic"], price: P(390000, 620000), segments: ["franchise", "independent"] },
  { make: "Toyota", model: "Corolla", variants: ["1.8 Hybrid XS", "2.0 XR"], body: "Sedan", fuels: ["Petrol", "Hybrid"], drives: ["FWD"], trans: ["Automatic"], price: P(400000, 620000), segments: ["franchise", "independent"] },
  { make: "Toyota", model: "Prado", variants: ["3.0 DT VX", "2.8 GD VX-L"], body: "SUV", fuels: ["Diesel"], drives: ["4x4"], trans: ["Automatic"], price: P(900000, 1600000), segments: ["luxury", "franchise"] },
  { make: "Toyota", model: "Land Cruiser", variants: ["79 4.5 DV6", "300 3.3 ZX"], body: "Double Cab", fuels: ["Diesel"], drives: ["4x4"], trans: ["Manual", "Automatic"], price: P(850000, 2100000), segments: ["commercial", "luxury"] },
  // Ford
  { make: "Ford", model: "Ranger", variants: ["2.0 SiT XL", "2.0 BiT Wildtrak", "3.0 V6 Raptor"], body: "Double Cab", fuels: ["Diesel", "Petrol"], drives: ["RWD", "4x4"], trans: ["Manual", "Automatic"], price: P(470000, 1300000), segments: ["commercial", "franchise", "independent"] },
  { make: "Ford", model: "Everest", variants: ["2.0 BiT XLT", "3.0 V6 Platinum"], body: "SUV", fuels: ["Diesel"], drives: ["RWD", "4x4"], trans: ["Automatic"], price: P(700000, 1300000), segments: ["franchise", "luxury"] },
  // Volkswagen
  { make: "Volkswagen", model: "Polo", variants: ["1.0 TSI Life", "1.0 TSI R-Line"], body: "Hatch", fuels: ["Petrol"], drives: ["FWD"], trans: ["Manual", "Automatic"], price: P(300000, 480000), segments: ["franchise", "independent", "budget"] },
  { make: "Volkswagen", model: "Polo Vivo", variants: ["1.4 Comfortline", "1.6 Highline"], body: "Hatch", fuels: ["Petrol"], drives: ["FWD"], trans: ["Manual"], price: P(180000, 300000), segments: ["budget", "independent"] },
  { make: "Volkswagen", model: "Amarok", variants: ["2.0 BiTDI Style", "3.0 V6 Aventura"], body: "Double Cab", fuels: ["Diesel"], drives: ["RWD", "4x4"], trans: ["Automatic"], price: P(600000, 1250000), segments: ["commercial", "franchise"] },
  { make: "Volkswagen", model: "Tiguan", variants: ["1.4 TSI Life", "2.0 TDI R-Line"], body: "SUV", fuels: ["Petrol", "Diesel"], drives: ["FWD", "AWD"], trans: ["Automatic"], price: P(450000, 850000), segments: ["franchise", "independent"] },
  // BMW
  { make: "BMW", model: "X1", variants: ["sDrive18i", "xDrive20d M Sport"], body: "SUV", fuels: ["Petrol", "Diesel"], drives: ["FWD", "AWD"], trans: ["Automatic"], price: P(480000, 900000), segments: ["luxury", "franchise"] },
  { make: "BMW", model: "X3", variants: ["xDrive20d", "xDrive30d M Sport"], body: "SUV", fuels: ["Diesel", "Petrol"], drives: ["AWD"], trans: ["Automatic"], price: P(650000, 1300000), segments: ["luxury", "franchise"] },
  { make: "BMW", model: "X5", variants: ["xDrive30d", "xDrive40i M Sport"], body: "SUV", fuels: ["Diesel", "Petrol"], drives: ["AWD"], trans: ["Automatic"], price: P(950000, 1900000), segments: ["luxury"] },
  { make: "BMW", model: "320i", variants: ["M Sport", "Luxury Line"], body: "Sedan", fuels: ["Petrol"], drives: ["RWD"], trans: ["Automatic"], price: P(480000, 950000), segments: ["luxury", "independent"] },
  { make: "BMW", model: "M340i", variants: ["xDrive"], body: "Sedan", fuels: ["Petrol"], drives: ["AWD"], trans: ["Automatic"], price: P(900000, 1500000), segments: ["luxury"] },
  // Mercedes-Benz
  { make: "Mercedes-Benz", model: "C-Class", variants: ["C200 AMG Line", "C220d Avantgarde"], body: "Sedan", fuels: ["Petrol", "Diesel"], drives: ["RWD"], trans: ["Automatic"], price: P(550000, 1150000), segments: ["luxury", "franchise"] },
  { make: "Mercedes-Benz", model: "GLC", variants: ["GLC220d", "GLC300 AMG Line"], body: "SUV", fuels: ["Diesel", "Petrol"], drives: ["AWD"], trans: ["Automatic"], price: P(700000, 1400000), segments: ["luxury"] },
  { make: "Mercedes-Benz", model: "GLE", variants: ["GLE400d AMG Line"], body: "SUV", fuels: ["Diesel"], drives: ["AWD"], trans: ["Automatic"], price: P(1100000, 2200000), segments: ["luxury"] },
  { make: "Mercedes-Benz", model: "V-Class", variants: ["V250d Avantgarde"], body: "MPV", fuels: ["Diesel"], drives: ["RWD"], trans: ["Automatic"], price: P(900000, 1600000), segments: ["luxury", "commercial"] },
  // Audi
  { make: "Audi", model: "A3", variants: ["35 TFSI S line", "40 TFSI"], body: "Hatch", fuels: ["Petrol"], drives: ["FWD"], trans: ["Automatic"], price: P(450000, 800000), segments: ["luxury", "independent"] },
  { make: "Audi", model: "Q3", variants: ["35 TFSI S line", "40 TDI quattro"], body: "SUV", fuels: ["Petrol", "Diesel"], drives: ["FWD", "AWD"], trans: ["Automatic"], price: P(520000, 950000), segments: ["luxury", "franchise"] },
  { make: "Audi", model: "Q5", variants: ["40 TDI quattro S line"], body: "SUV", fuels: ["Diesel"], drives: ["AWD"], trans: ["Automatic"], price: P(700000, 1300000), segments: ["luxury"] },
  // Isuzu / Nissan / Mahindra
  { make: "Isuzu", model: "D-Max", variants: ["1.9 Ddi LS", "3.0 Ddi V-Cross"], body: "Double Cab", fuels: ["Diesel"], drives: ["RWD", "4x4"], trans: ["Manual", "Automatic"], price: P(440000, 950000), segments: ["commercial", "independent"] },
  { make: "Nissan", model: "Navara", variants: ["2.5 DDTi LE", "2.5 DDTi Pro-4X"], body: "Double Cab", fuels: ["Diesel"], drives: ["RWD", "4x4"], trans: ["Manual", "Automatic"], price: P(430000, 880000), segments: ["commercial", "independent"] },
  { make: "Nissan", model: "Magnite", variants: ["1.0 Acenta", "1.0 Turbo Tekna"], body: "SUV", fuels: ["Petrol"], drives: ["FWD"], trans: ["Manual", "Automatic"], price: P(230000, 380000), segments: ["budget", "independent"] },
  { make: "Mahindra", model: "Scorpio", variants: ["2.2 CRDe Z8L"], body: "SUV", fuels: ["Diesel"], drives: ["RWD", "4x4"], trans: ["Manual", "Automatic"], price: P(380000, 680000), segments: ["independent", "budget"] },
  { make: "Mahindra", model: "Pik Up", variants: ["2.2 CRDe S11 Karoo"], body: "Double Cab", fuels: ["Diesel"], drives: ["RWD", "4x4"], trans: ["Manual"], price: P(330000, 620000), segments: ["commercial", "budget"] },
  // Suzuki / Hyundai / Kia
  { make: "Suzuki", model: "Swift", variants: ["1.2 GL", "1.2 GLX"], body: "Hatch", fuels: ["Petrol"], drives: ["FWD"], trans: ["Manual", "Automatic"], price: P(190000, 300000), segments: ["budget", "independent"] },
  { make: "Suzuki", model: "Jimny", variants: ["1.5 GLX", "1.5 GLX 5-door"], body: "SUV", fuels: ["Petrol"], drives: ["4x4"], trans: ["Manual", "Automatic"], price: P(330000, 520000), segments: ["independent", "franchise"] },
  { make: "Suzuki", model: "Fronx", variants: ["1.5 GL", "1.0T GLX"], body: "SUV", fuels: ["Petrol"], drives: ["FWD"], trans: ["Manual", "Automatic"], price: P(260000, 400000), segments: ["budget", "franchise"] },
  { make: "Hyundai", model: "i20", variants: ["1.2 Motion", "1.0T Fluid"], body: "Hatch", fuels: ["Petrol"], drives: ["FWD"], trans: ["Manual", "Automatic"], price: P(240000, 390000), segments: ["budget", "independent"] },
  { make: "Hyundai", model: "Tucson", variants: ["2.0 Premium", "1.6T Elite"], body: "SUV", fuels: ["Petrol", "Diesel"], drives: ["FWD", "AWD"], trans: ["Automatic"], price: P(420000, 780000), segments: ["franchise", "independent"] },
  { make: "Kia", model: "Sonet", variants: ["1.5 EX", "1.0T GT-Line"], body: "SUV", fuels: ["Petrol"], drives: ["FWD"], trans: ["Manual", "Automatic"], price: P(270000, 430000), segments: ["budget", "franchise"] },
  { make: "Kia", model: "Sportage", variants: ["1.6T GT-Line", "2.0 Ignite Plus"], body: "SUV", fuels: ["Petrol", "Diesel"], drives: ["FWD", "AWD"], trans: ["Automatic"], price: P(450000, 850000), segments: ["franchise", "independent"] },
  // Additional brands
  { make: "Lexus", model: "NX", variants: ["350h SE"], body: "SUV", fuels: ["Hybrid"], drives: ["AWD"], trans: ["Automatic"], price: P(850000, 1400000), segments: ["luxury"] },
  { make: "Volvo", model: "XC60", variants: ["B5 Plus", "Recharge T8"], body: "SUV", fuels: ["Petrol", "Electric"], drives: ["AWD"], trans: ["Automatic"], price: P(800000, 1500000), segments: ["luxury"] },
  { make: "Mitsubishi", model: "Triton", variants: ["2.4 DI-D Xtreme"], body: "Double Cab", fuels: ["Diesel"], drives: ["4x4"], trans: ["Automatic"], price: P(450000, 800000), segments: ["commercial"] },
  { make: "Mazda", model: "CX-5", variants: ["2.0 Active", "2.2DE Individual"], body: "SUV", fuels: ["Petrol", "Diesel"], drives: ["FWD", "AWD"], trans: ["Automatic"], price: P(420000, 800000), segments: ["franchise", "independent"] },
  { make: "Honda", model: "Fit", variants: ["1.5 Comfort"], body: "Hatch", fuels: ["Petrol"], drives: ["FWD"], trans: ["Automatic"], price: P(250000, 400000), segments: ["budget", "independent"] },
  { make: "Renault", model: "Kiger", variants: ["1.0 Turbo Intens"], body: "SUV", fuels: ["Petrol"], drives: ["FWD"], trans: ["Manual", "Automatic"], price: P(240000, 380000), segments: ["budget"] },
  { make: "Peugeot", model: "2008", variants: ["1.2 PureTech Allure"], body: "SUV", fuels: ["Petrol"], drives: ["FWD"], trans: ["Automatic"], price: P(380000, 580000), segments: ["independent", "franchise"] },
  { make: "Volkswagen", model: "Caddy", variants: ["2.0 TDI Panel Van"], body: "Panel Van", fuels: ["Diesel"], drives: ["FWD"], trans: ["Manual"], price: P(320000, 560000), segments: ["commercial"] },
];

export const COLOURS = [
  "Pearl White", "Solid White", "Midnight Black", "Silver Metallic", "Graphite Grey",
  "Deep Blue", "Racing Red", "Gunmetal", "Bronze", "Sand Beige", "Forest Green",
];

/** Local, app-served assets only: remote hosts are rejected by the image pipeline. */
export const VEHICLE_IMAGE_SET = [
  { slot: "cover", url: "/images/vehicles/vehicle-details-hero.webp" },
  { slot: "front", url: "/images/hero/surf4cars-premium-hero-v3.webp" },
  { slot: "rear", url: "/images/dashboard/inventory-management-hero.webp" },
  { slot: "left", url: "/images/dashboard/dealer-dashboard-hero.webp" },
  { slot: "right", url: "/images/dealers/dealer-profile-hero.webp" },
  { slot: "interior", url: "/images/vehicles/vehicle-details-hero.webp" },
  { slot: "dashboard", url: "/images/dashboard/dealer-dashboard-hero.webp" },
  { slot: "seats", url: "/images/dealers/dealer-profile-hero.webp" },
  { slot: "engine", url: "/images/dashboard/inventory-management-hero.webp" },
  { slot: "wheels", url: "/images/hero/surf4cars-premium-hero-v3.webp" },
];

export const FIRST_NAMES = ["Thabo", "Lerato", "Sipho", "Naledi", "Johan", "Anele", "Pieter", "Zanele", "Riaan", "Nomsa", "Kagiso", "Michelle", "Ahmed", "Chantal", "Sizwe", "Elmarie", "Tebogo", "Werner", "Precious", "Devan"];
export const LAST_NAMES = ["Nkosi", "Van der Merwe", "Dlamini", "Botha", "Mokoena", "Naidoo", "Pretorius", "Khumalo", "Jacobs", "Mahlangu", "Fourie", "Zulu", "Petersen", "Ndlovu", "Steyn", "Molefe"];

export const DEALER_NAME_PARTS = {
  franchise: ["Motors", "Auto Group", "Vehicles"],
  independent: ["Auto", "Cars", "Motor Company"],
  commercial: ["Commercial", "Trucks & Bakkies", "Fleet"],
  luxury: ["Prestige", "Premium Auto", "Luxury Motors"],
  budget: ["Value Cars", "Budget Auto", "Car Deals"],
};

export const DEALER_PREFIXES = ["Summit", "Atlantic", "Highveld", "Coastal", "Kalahari", "Table Bay", "Drakensberg", "Karoo", "Golden Gate", "Sunward", "Northcliff", "Silverstone", "Boulevard", "Crown", "Vaal", "Emerald", "Protea", "Aloe", "Baobab", "Cheetah"];
