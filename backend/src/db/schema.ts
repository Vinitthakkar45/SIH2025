import { pgTable, serial, text, doublePrecision, integer } from "drizzle-orm/pg-core";

// -----------------------------------------
// STATE REPORT
// -----------------------------------------
export const stateReport = pgTable("state_report", {
  id: serial("id").primaryKey(),

  year: text("year").notNull(),
  state: text("state").notNull(),
  district: text("district").notNull(),
  assessment_unit: text("assessment_unit"),
  serial_no: integer("serial_no"),

  // rainfall_mm
  rainfall_contaminated: doublePrecision("rainfall_contaminated"),
  rainfall_non_contaminated: doublePrecision("rainfall_non_contaminated"),
  rainfall_poor_quality: doublePrecision("rainfall_poor_quality"),
  rainfall_total: doublePrecision("rainfall_total"),

  // geographical area
  recharge_worthy_contaminated: doublePrecision("recharge_worthy_contaminated"),
  recharge_worthy_non_contaminated: doublePrecision("recharge_worthy_non_contaminated"),
  recharge_worthy_poor_quality: doublePrecision("recharge_worthy_poor_quality"),
  recharge_worthy_total: doublePrecision("recharge_worthy_total"),

  hilly_area: doublePrecision("hilly_area"),
  geo_area_total: doublePrecision("geo_area_total"),

  rainfall_recharge_contaminated: doublePrecision("rainfall_recharge_contaminated"),
  rainfall_recharge_non_contaminated: doublePrecision("rainfall_recharge_non_contaminated"),
  rainfall_recharge_poor_quality: doublePrecision("rainfall_recharge_poor_quality"),
  rainfall_recharge_total: doublePrecision("rainfall_recharge_total"),

  tanks_ponds_contaminated: doublePrecision("tanks_ponds_contaminated"),
  tanks_ponds_non_contaminated: doublePrecision("tanks_ponds_non_contaminated"),
  tanks_ponds_poor_quality: doublePrecision("tanks_ponds_poor_quality"),
  tanks_ponds_total: doublePrecision("tanks_ponds_total"),

  subtotal_contaminated: doublePrecision("subtotal_contaminated"),
  subtotal_non_contaminated: doublePrecision("subtotal_non_contaminated"),
  subtotal_poor_quality: doublePrecision("subtotal_poor_quality"),
  subtotal_total: doublePrecision("subtotal_total"),

  annual_gw_recharge_contaminated: doublePrecision("annual_gw_recharge_contaminated"),
  annual_gw_recharge_non_contaminated: doublePrecision("annual_gw_recharge_non_contaminated"),
  annual_gw_recharge_poor_quality: doublePrecision("annual_gw_recharge_poor_quality"),
  annual_gw_recharge_total: doublePrecision("annual_gw_recharge_total"),

  environmental_flow_contaminated: doublePrecision("environmental_flow_contaminated"),
  environmental_flow_non_contaminated: doublePrecision("environmental_flow_non_contaminated"),
  environmental_flow_poor_quality: doublePrecision("environmental_flow_poor_quality"),
  environmental_flow_total: doublePrecision("environmental_flow_total"),

  extractable_contaminated: doublePrecision("extractable_contaminated"),
  extractable_non_contaminated: doublePrecision("extractable_non_contaminated"),
  extractable_poor_quality: doublePrecision("extractable_poor_quality"),
  extractable_total: doublePrecision("extractable_total"),

  extraction_domestic_c: doublePrecision("extraction_domestic_c"),
  extraction_domestic_nc: doublePrecision("extraction_domestic_nc"),
  extraction_domestic_pq: doublePrecision("extraction_domestic_pq"),
  extraction_domestic_total: doublePrecision("extraction_domestic_total"),

  stage_extraction_contaminated: doublePrecision("stage_extraction_contaminated"),
  stage_extraction_non_contaminated: doublePrecision("stage_extraction_non_contaminated"),
  stage_extraction_poor_quality: doublePrecision("stage_extraction_poor_quality"),
  stage_extraction_total: doublePrecision("stage_extraction_total"),

  allocation_domestic_c: doublePrecision("allocation_domestic_c"),
  allocation_domestic_nc: doublePrecision("allocation_domestic_nc"),
  allocation_domestic_pq: doublePrecision("allocation_domestic_pq"),
  allocation_domestic_total: doublePrecision("allocation_domestic_total"),

  net_gw_availability_c: doublePrecision("net_gw_availability_c"),
  net_gw_availability_nc: doublePrecision("net_gw_availability_nc"),
  net_gw_availability_pq: doublePrecision("net_gw_availability_pq"),
  net_gw_availability_total: doublePrecision("net_gw_availability_total"),

  waterlogged: doublePrecision("waterlogged"),
  flood_prone: doublePrecision("flood_prone"),
  spring_discharge: doublePrecision("spring_discharge"),

  fresh_unconfined: doublePrecision("fresh_unconfined"),
  saline_unconfined: doublePrecision("saline_unconfined"),
  fresh_confined: doublePrecision("fresh_confined"),
  saline_confined: doublePrecision("saline_confined"),
  fresh_semi_confined: doublePrecision("fresh_semi_confined"),
  saline_semi_confined: doublePrecision("saline_semi_confined"),
});

// -----------------------------------------
// CENTRAL REPORT
// -----------------------------------------
export const centralReport = pgTable("central_report", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  serial_no: integer("serial_no"),

  state: text("state").notNull(),
  district: text("district"),
  assessment_unit: text("assessment_unit"),

  rainfall_contaminated: doublePrecision("rainfall_contaminated"),
  rainfall_non_contaminated: doublePrecision("rainfall_non_contaminated"),
  rainfall_poor_quality: doublePrecision("rainfall_poor_quality"),
  rainfall_total: doublePrecision("rainfall_total"),

  recharge_worthy_contaminated: doublePrecision("recharge_worthy_contaminated"),
  recharge_worthy_non_contaminated: doublePrecision("recharge_worthy_non_contaminated"),
  recharge_worthy_poor_quality: doublePrecision("recharge_worthy_poor_quality"),
  recharge_worthy_total: doublePrecision("recharge_worthy_total"),

  hilly_area: doublePrecision("hilly_area"),
  geo_area_total: doublePrecision("geo_area_total"),

  rainfall_recharge_contaminated: doublePrecision("rainfall_recharge_contaminated"),
  rainfall_recharge_non_contaminated: doublePrecision("rainfall_recharge_non_contaminated"),
  rainfall_recharge_poor_quality: doublePrecision("rainfall_recharge_poor_quality"),
  rainfall_recharge_total: doublePrecision("rainfall_recharge_total"),

  recharge_other_monsoon: doublePrecision("recharge_other_monsoon"),
  non_monsoon_rainfall: doublePrecision("non_monsoon_rainfall"),
  total_annual_recharge: doublePrecision("total_annual_recharge"),
  natural_discharge: doublePrecision("natural_discharge"),

  annual_extractable: doublePrecision("annual_extractable"),
  extraction_irrigation: doublePrecision("extraction_irrigation"),
  extraction_domestic: doublePrecision("extraction_domestic"),
  extraction_industrial: doublePrecision("extraction_industrial"),
  extraction_total: doublePrecision("extraction_total"),

  stage_percent: doublePrecision("stage_percent"),
  categorization: text("categorization"),
});

// -----------------------------------------
// ATTRIBUTE SUMMARY
// -----------------------------------------
export const attributeSummary = pgTable("attribute_summary", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  state: text("state").notNull(),

  over_exploited_count: doublePrecision("over_exploited_count"),
  safe_count: doublePrecision("safe_count"),
  saline_count: doublePrecision("saline_count"),
  critical_count: doublePrecision("critical_count"),
  semi_critical_count: doublePrecision("semi_critical_count"),
  total_count: doublePrecision("total_count"),
});

// -----------------------------------------
// ATTRIBUTE DETAILED
// -----------------------------------------
export const attributeDetailed = pgTable("attribute_detailed", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  serial_no: integer("serial_no"),

  state_code: text("state_code"),
  district_code: text("district_code"),
  block_code: text("block_code"),

  state: text("state").notNull(),
  district: text("district").notNull(),
  assessment_unit: text("assessment_unit"),

  geo_area: doublePrecision("geo_area"),
  recharge_worthy_area: doublePrecision("recharge_worthy_area"),

  recharge_rainfall_m: doublePrecision("recharge_rainfall_m"),
  recharge_other_m: doublePrecision("recharge_other_m"),
  recharge_rainfall_nm: doublePrecision("recharge_rainfall_nm"),
  recharge_other_nm: doublePrecision("recharge_other_nm"),

  annual_recharge: doublePrecision("annual_recharge"),
  natural_discharge: doublePrecision("natural_discharge"),
  annual_extractable: doublePrecision("annual_extractable"),

  extraction_irrigation: doublePrecision("extraction_irrigation"),
  extraction_industrial: doublePrecision("extraction_industrial"),
  extraction_domestic: doublePrecision("extraction_domestic"),
  extraction_total: doublePrecision("extraction_total"),

  allocation_domestic_2025: doublePrecision("allocation_domestic_2025"),
  net_availability: doublePrecision("net_availability"),

  stage_percent: doublePrecision("stage_percent"),
  categorization: text("categorization"),
  aquifer: text("aquifer"),
});

// -----------------------------------------
// ANNEXURE 1
// -----------------------------------------
export const annexure1 = pgTable("annexure1", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  serial_no: integer("serial_no"),
  state: text("state").notNull(),

  m_rainfall: doublePrecision("m_rainfall"),
  m_other_sources: doublePrecision("m_other_sources"),

  nm_rainfall: doublePrecision("nm_rainfall"),
  nm_other_sources: doublePrecision("nm_other_sources"),

  total_annual_recharge: doublePrecision("total_annual_recharge"),
  natural_discharge: doublePrecision("natural_discharge"),

  annual_extractable: doublePrecision("annual_extractable"),

  irri: doublePrecision("irri"),
  ind: doublePrecision("ind"),
  dom: doublePrecision("dom"),
  extraction_total: doublePrecision("extraction_total"),

  allocation_domestic: doublePrecision("allocation_domestic"),
  net_availability: doublePrecision("net_availability"),
  stage_percent: doublePrecision("stage_percent"),
});

// -----------------------------------------
// ANNEXURE 2
// -----------------------------------------
export const annexure2 = pgTable("annexure2", {
  id: serial("id").primaryKey(),

  year: text("year").notNull(),
  serial_no: integer("serial_no"),

  state: text("state").notNull(),
  district: text("district").notNull(),

  m_rainfall: doublePrecision("m_rainfall"),
  m_other_sources: doublePrecision("m_other_sources"),
  nm_rainfall: doublePrecision("nm_rainfall"),
  nm_other_sources: doublePrecision("nm_other_sources"),
  total_annual: doublePrecision("total_annual"),

  natural_discharge: doublePrecision("natural_discharge"),
  annual_extractable: doublePrecision("annual_extractable"),

  ext_irri: doublePrecision("ext_irri"),
  ext_ind: doublePrecision("ext_ind"),
  ext_dom: doublePrecision("ext_dom"),
  ext_total: doublePrecision("ext_total"),

  allocation_domestic: doublePrecision("allocation_domestic"),
  net_availability: doublePrecision("net_availability"),
  stage_percent: doublePrecision("stage_percent"),
});

// -----------------------------------------
// ANNEXURE 3A
// -----------------------------------------
export const annexure3a = pgTable("annexure3a_state_categorization", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  serial_no: integer("serial_no"),
  state: text("state").notNull(),

  total_assessed_units: doublePrecision("total_assessed_units"),

  safe_count: doublePrecision("safe_count"),
  safe_percent: doublePrecision("safe_percent"),

  semi_critical_count: doublePrecision("semi_critical_count"),
  semi_critical_percent: doublePrecision("semi_critical_percent"),

  critical_count: doublePrecision("critical_count"),
  critical_percent: doublePrecision("critical_percent"),

  over_exploited_count: doublePrecision("over_exploited_count"),
  over_exploited_percent: doublePrecision("over_exploited_percent"),

  saline_count: doublePrecision("saline_count"),
  saline_percent: doublePrecision("saline_percent"),
});

// -----------------------------------------
// ANNEXURE 3B
// -----------------------------------------
export const annexure3b = pgTable("annexure3b_district_categorization", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  serial_no: integer("serial_no"),

  state: text("state").notNull(),
  district: text("district").notNull(),

  total_assessed_units: doublePrecision("total_assessed_units"),

  safe_count: doublePrecision("safe_count"),
  safe_percent: doublePrecision("safe_percent"),

  semi_critical_count: doublePrecision("semi_critical_count"),
  semi_critical_percent: doublePrecision("semi_critical_percent"),

  critical_count: doublePrecision("critical_count"),
  critical_percent: doublePrecision("critical_percent"),

  over_exploited_count: doublePrecision("over_exploited_count"),
  over_exploited_percent: doublePrecision("over_exploited_percent"),

  saline_count: doublePrecision("saline_count"),
  saline_percent: doublePrecision("saline_percent"),
});

// -----------------------------------------
// ANNEXURE 3C
// -----------------------------------------
export const annexure3c = pgTable("annexure3c_state_extractable_resource", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  serial_no: integer("serial_no"),
  state: text("state").notNull(),

  total_extractable_resource_ham: doublePrecision("total_extractable_resource_ham"),

  safe_resource_ham: doublePrecision("safe_resource_ham"),
  safe_percent: doublePrecision("safe_percent"),

  semi_critical_resource_ham: doublePrecision("semi_critical_resource_ham"),
  semi_critical_percent: doublePrecision("semi_critical_percent"),

  critical_resource_ham: doublePrecision("critical_resource_ham"),
  critical_percent: doublePrecision("critical_percent"),

  over_exploited_resource_ham: doublePrecision("over_exploited_resource_ham"),
  over_exploited_percent: doublePrecision("over_exploited_percent"),

  saline_resource_ham: doublePrecision("saline_resource_ham"),
  saline_percent: doublePrecision("saline_percent"),
});

// -----------------------------------------
// ANNEXURE 3D
// -----------------------------------------
export const annexure3d = pgTable("annexure3d_district_extractable_resource", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  serial_no: integer("serial_no"),

  state: text("state").notNull(),
  district: text("district").notNull(),

  total_extractable_resource_ham: doublePrecision("total_extractable_resource_ham"),

  safe_resource_ham: doublePrecision("safe_resource_ham"),
  safe_percent: doublePrecision("safe_percent"),

  semi_critical_resource_ham: doublePrecision("semi_critical_resource_ham"),
  semi_critical_percent: doublePrecision("semi_critical_percent"),

  critical_resource_ham: doublePrecision("critical_resource_ham"),
  critical_percent: doublePrecision("critical_percent"),

  over_exploited_resource_ham: doublePrecision("over_exploited_resource_ham"),
  over_exploited_percent: doublePrecision("over_exploited_percent"),

  saline_resource_ham: doublePrecision("saline_resource_ham"),
  saline_percent: doublePrecision("saline_percent"),
});

// -----------------------------------------
// ANNEXURE 3E
// -----------------------------------------
export const annexure3e = pgTable("annexure3e_state_area_categorization", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  serial_no: integer("serial_no"),
  state: text("state").notNull(),

  total_geographical_area_sq_km: doublePrecision("total_geographical_area_sq_km"),
  recharge_worthy_area_sq_km: doublePrecision("recharge_worthy_area_sq_km"),

  safe_area_sq_km: doublePrecision("safe_area_sq_km"),
  safe_percent: doublePrecision("safe_percent"),

  semi_critical_area_sq_km: doublePrecision("semi_critical_area_sq_km"),
  semi_critical_percent: doublePrecision("semi_critical_percent"),

  critical_area_sq_km: doublePrecision("critical_area_sq_km"),
  critical_percent: doublePrecision("critical_percent"),

  over_exploited_area_sq_km: doublePrecision("over_exploited_area_sq_km"),
  over_exploited_percent: doublePrecision("over_exploited_percent"),

  saline_area_sq_km: doublePrecision("saline_area_sq_km"),
  saline_percent: doublePrecision("saline_percent"),
});

// -----------------------------------------
// ANNEXURE 3F
// -----------------------------------------
export const annexure3f = pgTable("annexure3f_district_area_categorization", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  serial_no: integer("serial_no"),

  state: text("state").notNull(),
  district: text("district").notNull(),

  total_recharge_worthy_area_sq_km: doublePrecision("total_recharge_worthy_area_sq_km"),

  safe_area_sq_km: doublePrecision("safe_area_sq_km"),
  safe_percent: doublePrecision("safe_percent"),

  semi_critical_area_sq_km: doublePrecision("semi_critical_area_sq_km"),
  semi_critical_percent: doublePrecision("semi_critical_percent"),

  critical_area_sq_km: doublePrecision("critical_area_sq_km"),
  critical_percent: doublePrecision("critical_percent"),

  over_exploited_area_sq_km: doublePrecision("over_exploited_area_sq_km"),
  over_exploited_percent: doublePrecision("over_exploited_percent"),

  saline_area_sq_km: doublePrecision("saline_area_sq_km"),
  saline_percent: doublePrecision("saline_percent"),
});

// -----------------------------------------
// ANNEXURE 4A
// -----------------------------------------
export const annexure4a = pgTable("annexure4a_categorized_units", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),

  state: text("state").notNull(),
  district: text("district").notNull(),

  semi_critical_unit: text("semi_critical_unit"),
  critical_unit: text("critical_unit"),
  over_exploited_unit: text("over_exploited_unit"),
});

// -----------------------------------------
// ANNEXURE 4B
// -----------------------------------------
export const annexure4b = pgTable("annexure4b_quality_problems", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),

  state: text("state").notNull(),
  district: text("district").notNull(),

  fluoride_affected_unit: text("fluoride_affected_unit"),
  arsenic_affected_unit: text("arsenic_affected_unit"),
  salinity_affected_unit: text("salinity_affected_unit"),
});
