/**
 * SURF FOR CARS — equipment.
 *
 * Vehicle Detail, search, filters, comparison, the dealer portal and future AI services read equipment
 * through this module and nowhere else. A second query path is a regression: it is how a claim ends up on
 * screen without the provenance that makes it trustworthy.
 */
export {
  findVehicleIdsWithEquipment,
  loadEquipmentCatalogue,
  loadEquipmentFor,
  loadVehicleEquipment,
} from "./equipment.service";
