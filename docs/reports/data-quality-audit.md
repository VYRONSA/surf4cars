# Data quality audit

_Generated 2026-07-31 by `npm run audit:data` against 100 live listings. Nothing was modified._

This report exists because the alternative is worse. Bad data can be hidden inside a component — a
filter here, a fallback there — and the page will look fine while nobody who could fix the record ever
learns it is broken. Presentation rules should protect the customer *today*; this report is how the
underlying records actually get corrected.

Records are read from the running application, not the database, so what is measured is what a customer
is genuinely served — after projection, after fallbacks, after every rule the platform applies.

## Summary

| Priority | Issues | Meaning |
| --- | --- | --- |
| Critical | 39 | A customer is shown something wrong, misleading or internal. |
| High | 0 | The listing works but reads as unfinished. |
| Medium | 3 | Thin, but honest. |

60 of 100 listings audited had no issues.

## Critical

| Record | Field | Problem | Recommended correction |
| --- | --- | --- | --- |
| [2026 Toyota Hilux 2.8 GD-6 Raider](/vehicle/2026-toyota-hilux-2-8-gd-6-raider-s1-veh-0) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/toyota-hilux/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2026 Toyota Corolla 2.0 XR](/vehicle/2026-toyota-corolla-2-0-xr-s1-veh-0) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/toyota-corolla/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2026 Honda Fit 1.5 Comfort](/vehicle/2026-honda-fit-1-5-comfort-s1-veh-0) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/honda-fit/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2025 Mercedes-Benz C-Class C200 AMG Line](/vehicle/2025-mercedes-benz-c-class-c200-amg-line-s1-veh-0) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/mercedes-benz-c-class/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2025 Honda Fit 1.5 Comfort](/vehicle/2025-honda-fit-1-5-comfort-s1-veh-0) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/honda-fit/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 Volvo XC90 B5 Ultimate](/vehicle/2024-volvo-xc90-b5-ultimate-0c2b72d2) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/volvo-xc90/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 BMW X5 xDrive40i M Sport](/vehicle/2024-bmw-x5-xdrive40i-m-sport-1b1e11c7) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/bmw-x5/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 BMW X5 xDrive40i](/vehicle/2024-bmw-x5-xdrive40i-260747aa) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/bmw-x5/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 Volvo XC90 B5 Ultimate](/vehicle/2024-volvo-xc90-b5-ultimate-283a11c0) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/volvo-xc90/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 BMW X5 xDrive40i](/vehicle/2024-bmw-x5-xdrive40i-288ed93e) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/bmw-x5/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 BMW X5 xDrive40i](/vehicle/2024-bmw-x5-xdrive40i-2d7ee065) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/bmw-x5/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 BMW X5 xDrive40i](/vehicle/2024-bmw-x5-xdrive40i-39f303f6) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/bmw-x5/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 Volvo XC90 B5 Ultimate](/vehicle/2024-volvo-xc90-b5-ultimate-3b3a3f70) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/volvo-xc90/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 Volvo XC90 B5 Ultimate](/vehicle/2024-volvo-xc90-b5-ultimate-3f33ea41) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/volvo-xc90/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 BMW X5 xDrive40i](/vehicle/2024-bmw-x5-xdrive40i-5674b4ce) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/bmw-x5/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 Volvo XC90 B5 Ultimate](/vehicle/2024-volvo-xc90-b5-ultimate-572e1855) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/volvo-xc90/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 Volvo XC90](/vehicle/2024-volvo-xc90-57478690) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/volvo-xc90/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 BMW X5 xDrive40i](/vehicle/2024-bmw-x5-xdrive40i-59b28ff4) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/bmw-x5/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 BMW X5 xDrive40i](/vehicle/2024-bmw-x5-xdrive40i-62a09209) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/bmw-x5/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 BMW X5 xDrive40i](/vehicle/2024-bmw-x5-xdrive40i-6ab2dc0c) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/bmw-x5/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 Volvo XC90 B5 Ultimate](/vehicle/2024-volvo-xc90-b5-ultimate-726421b6) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/volvo-xc90/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 Volvo XC90 B5 Ultimate](/vehicle/2024-volvo-xc90-b5-ultimate-73187d28) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/volvo-xc90/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 Volvo XC90 B5 Ultimate](/vehicle/2024-volvo-xc90-b5-ultimate-7c0c90a3) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/volvo-xc90/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 Volvo XC90 B5 Ultimate](/vehicle/2024-volvo-xc90-b5-ultimate-841a639c) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/volvo-xc90/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 BMW X5 xDrive40i](/vehicle/2024-bmw-x5-xdrive40i-8c373486) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/bmw-x5/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 Volvo XC90](/vehicle/2024-volvo-xc90-9cc5ac84) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/volvo-xc90/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 BMW X5 xDrive40i](/vehicle/2024-bmw-x5-xdrive40i-b07d72da) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/bmw-x5/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 BMW X5 xDrive40i](/vehicle/2024-bmw-x5-xdrive40i-d3093359) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/bmw-x5/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 BMW X5 xDrive40i](/vehicle/2024-bmw-x5-xdrive40i-e255ae4c) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/bmw-x5/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 Volvo XC90 B5 Ultimate](/vehicle/2024-volvo-xc90-b5-ultimate-e683303a) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/volvo-xc90/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 Volvo XC90 B5 Ultimate](/vehicle/2024-volvo-xc90-b5-ultimate-f62b2d06) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/volvo-xc90/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 BMW X5 xDrive40i](/vehicle/2024-bmw-x5-xdrive40i-fef37c90) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/bmw-x5/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 Toyota Hilux 2.4 GD-6 SR](/vehicle/2024-toyota-hilux-2-4-gd-6-sr-s1-veh-0) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/toyota-hilux/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2024 Honda Fit 1.5 Comfort](/vehicle/2024-honda-fit-1-5-comfort-s1-veh-0) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/honda-fit/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2023 Toyota Hilux 2.8 GD-6 Raider](/vehicle/2023-toyota-hilux-2-8-gd-6-raider-s1-veh-0) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/toyota-hilux/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2023 Toyota Hilux 2.8 GD-6 Legend RS](/vehicle/2023-toyota-hilux-2-8-gd-6-legend-rs-s1-veh-0) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/toyota-hilux/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2022 Toyota Hilux 2.4 GD-6 SR](/vehicle/2022-toyota-hilux-2-4-gd-6-sr-s1-veh-0) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/toyota-hilux/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2022 Honda Fit 1.5 Comfort](/vehicle/2022-honda-fit-1-5-comfort-s1-veh-0) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/honda-fit/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |
| [2021 Toyota Hilux 2.8 GD-6 Legend RS](/vehicle/2021-toyota-hilux-2-8-gd-6-legend-rs-s1-veh-0) | Photography | Record still holds 1 photograph(s) suppressed by the presentation layer.<br>_“/images/vehicles/library/toyota-hilux/front.webp”_ | Replace the file on the record. The suppression is a safety net, not a fix. |

## Medium

| Record | Field | Problem | Recommended correction |
| --- | --- | --- | --- |
| [2024 Volvo XC90](/vehicle/2024-volvo-xc90-57478690) | Specifications | Only 4 specification fields — nothing beyond what the card already shows.<br>_“>Specifications Overview Make Volvo Model XC90 Year 2024 Mileage 18 000 km Specification”_ | Enrich from the VIN or model catalogue: drivetrain, engine, fuel, colour, service history. |
| [2024 Jaguar F-Pace](/vehicle/2024-jaguar-f-pace-8c3b190d) | Specifications | Only 4 specification fields — nothing beyond what the card already shows.<br>_“>Specifications Overview Make Jaguar Model F-Pace Year 2024 Mileage 21 000 km Specification”_ | Enrich from the VIN or model catalogue: drivetrain, engine, fuel, colour, service history. |
| [2024 Volvo XC90](/vehicle/2024-volvo-xc90-9cc5ac84) | Specifications | Only 4 specification fields — nothing beyond what the card already shows.<br>_“>Specifications Overview Make Volvo Model XC90 Year 2024 Mileage 18 000 km Specification”_ | Enrich from the VIN or model catalogue: drivetrain, engine, fuel, colour, service history. |

## How to read this

A **Critical** row is a launch blocker: internal build text, or a photograph the platform is actively
suppressing. Suppression is a safety net — the record is still wrong, and the net only covers the
surfaces that consume the presentation layer.

**High** and **Medium** rows are the difference between a marketplace that looks maintained and one
that looks abandoned. They are dealer-facing work, and the strongest argument for the listing quality
score already shown in the dealer portal.
