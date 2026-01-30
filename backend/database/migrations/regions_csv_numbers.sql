-- Update existing regions with numbers/types from Outvoted Strategy Game CSV only (no table wipe)
USE outvoted;

UPDATE regions SET
  population = 1217000, bosniak_pop = 987500, croat_pop = 162500, serb_pop = 33000, other_pop = 34000,
  conservative_share = 0.5966, liberal_share = 0.0703, socialist_share = 0.3331,
  administrative_importance = 'FBiH'
WHERE code = 'FBIH_CENTRAL';

UPDATE regions SET
  population = 435000, bosniak_pop = 135000, croat_pop = 214000, serb_pop = 77000, other_pop = 9000,
  conservative_share = 0.8092, liberal_share = 0.0448, socialist_share = 0.1460,
  administrative_importance = 'FBiH'
WHERE code = 'FBIH_WEST';

UPDATE regions SET
  population = 419500, bosniak_pop = 35500, croat_pop = 7500, serb_pop = 366500, other_pop = 10000,
  conservative_share = 0.5101, liberal_share = 0.0608, socialist_share = 0.4291,
  administrative_importance = 'RS'
WHERE code = 'RS_EAST';

UPDATE regions SET
  population = 845000, bosniak_pop = 66500, croat_pop = 18000, serb_pop = 748500, other_pop = 12000,
  conservative_share = 0.4503, liberal_share = 0.0598, socialist_share = 0.4899,
  administrative_importance = 'RS'
WHERE code = 'RS_WEST';

UPDATE regions SET
  population = 87500, bosniak_pop = 37000, croat_pop = 16000, serb_pop = 31500, other_pop = 3000,
  conservative_share = 0.5200, liberal_share = 0.0800, socialist_share = 0.4000,
  administrative_importance = 'District'
WHERE code = 'BRCKO';

UPDATE regions SET
  population = 415000, bosniak_pop = 351500, croat_pop = 17000, serb_pop = 20000, other_pop = 26500,
  conservative_share = 0.4301, liberal_share = 0.2000, socialist_share = 0.3699,
  administrative_importance = 'FBiH'
WHERE code = 'SARAJEVO';
