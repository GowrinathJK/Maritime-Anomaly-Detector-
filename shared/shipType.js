// Maps AIS "type of ship and cargo" numeric codes (ITU-R M.1371) to the
// broad categories this product filters by. Used by ingestion when live
// ShipStaticData messages arrive; mockData.js assigns categories directly
// since it isn't simulating real AIS type codes.
function classifyShipType(code) {
  if (code == null) return 'unknown';
  if (code >= 60 && code <= 69) return 'cruise'; // passenger vessels
  if (code >= 70 && code <= 79) return 'cargo';
  if (code >= 80 && code <= 89) return 'tanker';
  return 'unknown';
}

module.exports = { classifyShipType };
