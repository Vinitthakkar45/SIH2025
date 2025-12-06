import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  stateReport,
  centralReport,
  attributeSummary,
  attributeDetailed,
  annexure1,
  annexure2,
  annexure3a,
  annexure3b,
  annexure3c,
  annexure3d,
  annexure3e,
  annexure3f,
  annexure4a,
  annexure4b,
} from "../db/schema";

const pool = new Pool({
  user: "postgres",
  password: "postgres",
  host: "localhost",
  port: 5432,
  database: "ingres",
});

const db = drizzle(pool);

// Helper to safely get nested value
const safe = (obj: any, ...keys: string[]): any => {
  let result = obj;
  for (const key of keys) {
    if (result == null) return null;
    result = result[key];
  }
  return result ?? null;
};

// ========== STATE REPORT LOADER ==========
async function loadStateReport(filePath: string) {
  console.log(`Loading state report: ${filePath}`);
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const year = raw.year;
  const records = raw.data || [];

  const rows = records.map((r: any) => ({
    year: r.year || year,
    state: r.state,
    district: r.district || "",
    assessment_unit: r.assessment_unit,
    serial_no: r.serial_no,

    // rainfall_mm
    rainfall_contaminated: safe(r, "rainfall_mm", "contaminated"),
    rainfall_non_contaminated: safe(r, "rainfall_mm", "non_contaminated"),
    rainfall_poor_quality: safe(r, "rainfall_mm", "poor_quality"),
    rainfall_total: safe(r, "rainfall_mm", "total"),

    // geographical_area_ha -> recharge_worthy
    recharge_worthy_contaminated: safe(r, "geographical_area_ha", "recharge_worthy", "contaminated"),
    recharge_worthy_non_contaminated: safe(r, "geographical_area_ha", "recharge_worthy", "non_contaminated"),
    recharge_worthy_poor_quality: safe(r, "geographical_area_ha", "recharge_worthy", "poor_quality"),
    recharge_worthy_total: safe(r, "geographical_area_ha", "recharge_worthy", "total"),

    hilly_area: safe(r, "geographical_area_ha", "hilly_area"),
    geo_area_total: safe(r, "geographical_area_ha", "total"),

    // ground_water_recharge_ham -> rainfall_recharge
    rainfall_recharge_contaminated: safe(r, "ground_water_recharge_ham", "rainfall_recharge", "contaminated"),
    rainfall_recharge_non_contaminated: safe(r, "ground_water_recharge_ham", "rainfall_recharge", "non_contaminated"),
    rainfall_recharge_poor_quality: safe(r, "ground_water_recharge_ham", "rainfall_recharge", "poor_quality"),
    rainfall_recharge_total: safe(r, "ground_water_recharge_ham", "rainfall_recharge", "total"),

    // ground_water_recharge_ham -> tanks_and_ponds
    tanks_ponds_contaminated: safe(r, "ground_water_recharge_ham", "tanks_and_ponds", "contaminated"),
    tanks_ponds_non_contaminated: safe(r, "ground_water_recharge_ham", "tanks_and_ponds", "non_contaminated"),
    tanks_ponds_poor_quality: safe(r, "ground_water_recharge_ham", "tanks_and_ponds", "poor_quality"),
    tanks_ponds_total: safe(r, "ground_water_recharge_ham", "tanks_and_ponds", "total"),

    // ground_water_recharge_ham -> subtotal
    subtotal_contaminated: safe(r, "ground_water_recharge_ham", "subtotal", "contaminated"),
    subtotal_non_contaminated: safe(r, "ground_water_recharge_ham", "subtotal", "non_contaminated"),
    subtotal_poor_quality: safe(r, "ground_water_recharge_ham", "subtotal", "poor_quality"),
    subtotal_total: safe(r, "ground_water_recharge_ham", "subtotal", "total"),

    // annual_gw_recharge_ham
    annual_gw_recharge_contaminated: safe(r, "annual_gw_recharge_ham", "contaminated"),
    annual_gw_recharge_non_contaminated: safe(r, "annual_gw_recharge_ham", "non_contaminated"),
    annual_gw_recharge_poor_quality: safe(r, "annual_gw_recharge_ham", "poor_quality"),
    annual_gw_recharge_total: safe(r, "annual_gw_recharge_ham", "total"),

    // environmental_flows_ham
    environmental_flow_contaminated: safe(r, "environmental_flows_ham", "contaminated"),
    environmental_flow_non_contaminated: safe(r, "environmental_flows_ham", "non_contaminated"),
    environmental_flow_poor_quality: safe(r, "environmental_flows_ham", "poor_quality"),
    environmental_flow_total: safe(r, "environmental_flows_ham", "total"),

    // annual_extractable_gw_resource_ham
    extractable_contaminated: safe(r, "annual_extractable_gw_resource_ham", "contaminated"),
    extractable_non_contaminated: safe(r, "annual_extractable_gw_resource_ham", "non_contaminated"),
    extractable_poor_quality: safe(r, "annual_extractable_gw_resource_ham", "poor_quality"),
    extractable_total: safe(r, "annual_extractable_gw_resource_ham", "total"),

    // gw_extraction_ham -> domestic
    extraction_domestic_c: safe(r, "gw_extraction_ham", "domestic", "contaminated"),
    extraction_domestic_nc: safe(r, "gw_extraction_ham", "domestic", "non_contaminated"),
    extraction_domestic_pq: safe(r, "gw_extraction_ham", "domestic", "poor_quality"),
    extraction_domestic_total: safe(r, "gw_extraction_ham", "domestic", "total"),

    // stage_of_extraction_percent
    stage_extraction_contaminated: safe(r, "stage_of_extraction_percent", "contaminated"),
    stage_extraction_non_contaminated: safe(r, "stage_of_extraction_percent", "non_contaminated"),
    stage_extraction_poor_quality: safe(r, "stage_of_extraction_percent", "poor_quality"),
    stage_extraction_total: safe(r, "stage_of_extraction_percent", "total"),

    // allocation_domestic_2025_ham
    allocation_domestic_c: safe(r, "allocation_domestic_2025_ham", "contaminated"),
    allocation_domestic_nc: safe(r, "allocation_domestic_2025_ham", "non_contaminated"),
    allocation_domestic_pq: safe(r, "allocation_domestic_2025_ham", "poor_quality"),
    allocation_domestic_total: safe(r, "allocation_domestic_2025_ham", "total"),

    // net_annual_gw_availability_ham
    net_gw_availability_c: safe(r, "net_annual_gw_availability_ham", "contaminated"),
    net_gw_availability_nc: safe(r, "net_annual_gw_availability_ham", "non_contaminated"),
    net_gw_availability_pq: safe(r, "net_annual_gw_availability_ham", "poor_quality"),
    net_gw_availability_total: safe(r, "net_annual_gw_availability_ham", "total"),

    // additional_potential_resources_ham
    waterlogged: safe(r, "additional_potential_resources_ham", "waterlogged_shallow_water_table"),
    flood_prone: safe(r, "additional_potential_resources_ham", "flood_prone"),
    spring_discharge: safe(r, "additional_potential_resources_ham", "spring_discharge"),

    // total_gw_availability_unconfined_ham
    fresh_unconfined: safe(r, "total_gw_availability_unconfined_ham", "fresh"),
    saline_unconfined: safe(r, "total_gw_availability_unconfined_ham", "saline"),

    // total_confined_gw_ham
    fresh_confined: safe(r, "total_confined_gw_ham", "fresh"),
    saline_confined: safe(r, "total_confined_gw_ham", "saline"),

    // total_semi_confined_gw_ham
    fresh_semi_confined: safe(r, "total_semi_confined_gw_ham", "fresh"),
    saline_semi_confined: safe(r, "total_semi_confined_gw_ham", "saline"),
  }));

  if (rows.length > 0) {
    // Insert in batches of 50 to avoid parameter limits
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      await db.insert(stateReport).values(batch);
    }
    console.log(`  Inserted ${rows.length} state report records`);
  }
}

// ========== CENTRAL REPORT LOADER ==========
async function loadCentralReport(filePath: string) {
  console.log(`Loading central report: ${filePath}`);
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const year = raw.year;
  const records = raw.records || [];

  const rows = records.map((r: any) => ({
    year: r.year || year,
    serial_no: r.serial_no ? Math.round(r.serial_no) : null,
    state: r.state,
    district: r.district,
    assessment_unit: r.assessment_unit,

    // rainfall_mm
    rainfall_contaminated: safe(r, "rainfall_mm", "contaminated"),
    rainfall_non_contaminated: safe(r, "rainfall_mm", "non_contaminated"),
    rainfall_poor_quality: safe(r, "rainfall_mm", "poor_quality"),
    rainfall_total: safe(r, "rainfall_mm", "total"),

    // total_geographical_area_ha -> recharge_worthy_area
    recharge_worthy_contaminated: safe(r, "total_geographical_area_ha", "recharge_worthy_area", "contaminated"),
    recharge_worthy_non_contaminated: safe(r, "total_geographical_area_ha", "recharge_worthy_area", "non_contaminated"),
    recharge_worthy_poor_quality: safe(r, "total_geographical_area_ha", "recharge_worthy_area", "poor_quality"),
    recharge_worthy_total: safe(r, "total_geographical_area_ha", "recharge_worthy_area", "total"),

    hilly_area: safe(r, "total_geographical_area_ha", "hilly_area"),
    geo_area_total: safe(r, "total_geographical_area_ha", "total"),

    // ground_water_recharge_ham -> rainfall_recharge
    rainfall_recharge_contaminated: safe(r, "ground_water_recharge_ham", "rainfall_recharge", "contaminated"),
    rainfall_recharge_non_contaminated: safe(r, "ground_water_recharge_ham", "rainfall_recharge", "non_contaminated"),
    rainfall_recharge_poor_quality: safe(r, "ground_water_recharge_ham", "rainfall_recharge", "poor_quality"),
    rainfall_recharge_total: safe(r, "ground_water_recharge_ham", "rainfall_recharge", "total"),

    recharge_other_monsoon: r.recharge_from_other_sources_monsoon_ham,
    non_monsoon_rainfall: r.recharge_from_rainfall_non_monsoon_ham,
    total_annual_recharge: r.total_annual_recharge_ham,
    natural_discharge: r.natural_discharge_ham,

    annual_extractable: r.annual_extractable_resource_ham,

    // current_extraction_ham
    extraction_irrigation: safe(r, "current_extraction_ham", "irrigation"),
    extraction_domestic: safe(r, "current_extraction_ham", "domestic"),
    extraction_industrial: safe(r, "current_extraction_ham", "industrial"),
    extraction_total: safe(r, "current_extraction_ham", "total"),

    stage_percent: r.stage_of_extraction_percent,
    categorization: r.categorization,
  }));

  if (rows.length > 0) {
    await db.insert(centralReport).values(rows);
    console.log(`  Inserted ${rows.length} central report records`);
  }
}

// ========== ATTRIBUTE REPORT LOADER ==========
async function loadAttributeReport(filePath: string) {
  console.log(`Loading attribute report: ${filePath}`);
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const year = raw.year;

  // Load summary
  const summaryRecords = raw.summary || [];
  const summaryRows = summaryRecords.map((r: any) => ({
    year,
    state: r.state,
    over_exploited_count: r.over_exploited_count,
    safe_count: r.safe_count,
    saline_count: r.saline_count,
    critical_count: r.critical_count,
    semi_critical_count: r.semi_critical_count,
    total_count: r.total_count,
  }));

  if (summaryRows.length > 0) {
    await db.insert(attributeSummary).values(summaryRows);
    console.log(`  Inserted ${summaryRows.length} attribute summary records`);
  }

  // Load detailed table
  const detailedRecords = raw.detailed_table || [];
  const detailedRows = detailedRecords.map((r: any) => ({
    year,
    serial_no: r.serial_no ? Math.round(r.serial_no) : null,
    state_code: r.state_code,
    district_code: r.state_district_code,
    block_code: r.state_district_block_code,
    state: r.state,
    district: r.district,
    assessment_unit: r.assessment_unit_name,

    geo_area: r.total_geographical_area_ha,
    recharge_worthy_area: r.recharge_worthy_area_ha,

    // recharge_ham
    recharge_rainfall_m: safe(r, "recharge_ham", "from_rainfall_monsoon"),
    recharge_other_m: safe(r, "recharge_ham", "from_other_sources_monsoon"),
    recharge_rainfall_nm: safe(r, "recharge_ham", "from_rainfall_non_monsoon"),
    recharge_other_nm: safe(r, "recharge_ham", "from_other_sources_non_monsoon"),

    annual_recharge: r.total_annual_recharge_ham,
    natural_discharge: r.total_natural_discharges_ham,
    annual_extractable: r.annual_extractable_resource_ham,

    // extraction_ham
    extraction_irrigation: safe(r, "extraction_ham", "irrigation"),
    extraction_industrial: safe(r, "extraction_ham", "industrial"),
    extraction_domestic: safe(r, "extraction_ham", "domestic"),
    extraction_total: safe(r, "extraction_ham", "total"),

    allocation_domestic_2025: r.annual_gw_allocation_domestic_2025_ham,
    net_availability: r.net_gw_availability_future_ham,

    stage_percent: r.stage_of_extraction_percent,
    categorization: r.categorization,
    aquifer: r.aquifer,
  }));

  if (detailedRows.length > 0) {
    // Insert in batches to avoid memory issues
    const batchSize = 1000;
    for (let i = 0; i < detailedRows.length; i += batchSize) {
      const batch = detailedRows.slice(i, i + batchSize);
      await db.insert(attributeDetailed).values(batch);
    }
    console.log(`  Inserted ${detailedRows.length} attribute detailed records`);
  }
}

// ========== ANNEXURE 1 LOADER ==========
async function loadAnnexure1(filePath: string) {
  console.log(`Loading annexure1: ${filePath}`);
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const year = raw.year;
  const records = raw.records || [];

  const rows = records.map((r: any) => ({
    year: r.year || year,
    serial_no: r.serial_no ? Math.round(r.serial_no) : null,
    state: r.state,

    // ground_water_recharge_bcm
    m_rainfall: safe(r, "ground_water_recharge_bcm", "monsoon_season", "from_rainfall"),
    m_other_sources: safe(r, "ground_water_recharge_bcm", "monsoon_season", "from_other_sources"),
    nm_rainfall: safe(r, "ground_water_recharge_bcm", "non_monsoon_season", "from_rainfall"),
    nm_other_sources: safe(r, "ground_water_recharge_bcm", "non_monsoon_season", "from_other_sources"),
    total_annual_recharge: safe(r, "ground_water_recharge_bcm", "total_annual"),

    natural_discharge: r.total_natural_discharges_bcm,
    annual_extractable: r.annual_extractable_resource_bcm,

    // current_annual_extraction_bcm
    irri: safe(r, "current_annual_extraction_bcm", "irrigation"),
    ind: safe(r, "current_annual_extraction_bcm", "industrial"),
    dom: safe(r, "current_annual_extraction_bcm", "domestic"),
    extraction_total: safe(r, "current_annual_extraction_bcm", "total"),

    allocation_domestic: r.annual_gw_allocation_domestic_bcm,
    net_availability: r.net_gw_availability_bcm,
    stage_percent: r.stage_of_extraction_percent,
  }));

  if (rows.length > 0) {
    await db.insert(annexure1).values(rows);
    console.log(`  Inserted ${rows.length} annexure1 records`);
  }
}

// ========== ANNEXURE 2 LOADER ==========
async function loadAnnexure2(filePath: string) {
  console.log(`Loading annexure2: ${filePath}`);
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const year = raw.year;
  const records = raw.records || [];

  const rows = records.map((r: any) => ({
    year: r.year || year,
    serial_no: r.serial_no ? Math.round(r.serial_no) : null,
    state: r.state,
    district: r.district,

    // ground_water_recharge_ham
    m_rainfall: safe(r, "ground_water_recharge_ham", "monsoon_season", "from_rainfall"),
    m_other_sources: safe(r, "ground_water_recharge_ham", "monsoon_season", "from_other_sources"),
    nm_rainfall: safe(r, "ground_water_recharge_ham", "non_monsoon_season", "from_rainfall"),
    nm_other_sources: safe(r, "ground_water_recharge_ham", "non_monsoon_season", "from_other_sources"),
    total_annual: safe(r, "ground_water_recharge_ham", "total_annual"),

    natural_discharge: r.total_natural_discharges_ham,
    annual_extractable: r.annual_extractable_resource_ham,

    // current_annual_extraction_ham
    ext_irri: safe(r, "current_annual_extraction_ham", "irrigation"),
    ext_ind: safe(r, "current_annual_extraction_ham", "industrial"),
    ext_dom: safe(r, "current_annual_extraction_ham", "domestic"),
    ext_total: safe(r, "current_annual_extraction_ham", "total"),

    allocation_domestic: r.annual_gw_allocation_domestic_ham,
    net_availability: r.net_gw_availability_ham,
    stage_percent: r.stage_of_extraction_percent,
  }));

  if (rows.length > 0) {
    await db.insert(annexure2).values(rows);
    console.log(`  Inserted ${rows.length} annexure2 records`);
  }
}

// ========== ANNEXURE 3 LOADER ==========
async function loadAnnexure3(filePath: string) {
  console.log(`Loading annexure3: ${filePath}`);
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const year = raw.year;

  // 3A - State Categorization
  const a3a = raw.annexure_3a_state_categorization || [];
  const rows3a = a3a.map((r: any) => ({
    year,
    serial_no: r.serial_no ? Math.round(r.serial_no) : null,
    state: r.state,
    total_assessed_units: r.total_assessed_units,
    safe_count: safe(r, "safe", "count"),
    safe_percent: safe(r, "safe", "percent"),
    semi_critical_count: safe(r, "semi_critical", "count"),
    semi_critical_percent: safe(r, "semi_critical", "percent"),
    critical_count: safe(r, "critical", "count"),
    critical_percent: safe(r, "critical", "percent"),
    over_exploited_count: safe(r, "over_exploited", "count"),
    over_exploited_percent: safe(r, "over_exploited", "percent"),
    saline_count: safe(r, "saline", "count"),
    saline_percent: safe(r, "saline", "percent"),
  }));
  if (rows3a.length > 0) {
    await db.insert(annexure3a).values(rows3a);
    console.log(`  Inserted ${rows3a.length} annexure3a records`);
  }

  // 3B - District Categorization
  const a3b = raw.annexure_3b_district_categorization || [];
  const rows3b = a3b.map((r: any) => ({
    year,
    serial_no: r.serial_no ? Math.round(r.serial_no) : null,
    state: r.state,
    district: r.district,
    total_assessed_units: r.total_assessed_units,
    safe_count: safe(r, "safe", "count"),
    safe_percent: safe(r, "safe", "percent"),
    semi_critical_count: safe(r, "semi_critical", "count"),
    semi_critical_percent: safe(r, "semi_critical", "percent"),
    critical_count: safe(r, "critical", "count"),
    critical_percent: safe(r, "critical", "percent"),
    over_exploited_count: safe(r, "over_exploited", "count"),
    over_exploited_percent: safe(r, "over_exploited", "percent"),
    saline_count: safe(r, "saline", "count"),
    saline_percent: safe(r, "saline", "percent"),
  }));
  if (rows3b.length > 0) {
    await db.insert(annexure3b).values(rows3b);
    console.log(`  Inserted ${rows3b.length} annexure3b records`);
  }

  // 3C - State Extractable Resource
  const a3c = raw.annexure_3c_state_extractable_resource || [];
  const rows3c = a3c.map((r: any) => ({
    year,
    serial_no: r.serial_no ? Math.round(r.serial_no) : null,
    state: r.state,
    total_extractable_resource_ham: r.total_extractable_resource_ham,
    safe_resource_ham: safe(r, "safe", "resource_ham"),
    safe_percent: safe(r, "safe", "percent"),
    semi_critical_resource_ham: safe(r, "semi_critical", "resource_ham"),
    semi_critical_percent: safe(r, "semi_critical", "percent"),
    critical_resource_ham: safe(r, "critical", "resource_ham"),
    critical_percent: safe(r, "critical", "percent"),
    over_exploited_resource_ham: safe(r, "over_exploited", "resource_ham"),
    over_exploited_percent: safe(r, "over_exploited", "percent"),
    saline_resource_ham: safe(r, "saline", "resource_ham"),
    saline_percent: safe(r, "saline", "percent"),
  }));
  if (rows3c.length > 0) {
    await db.insert(annexure3c).values(rows3c);
    console.log(`  Inserted ${rows3c.length} annexure3c records`);
  }

  // 3D - District Extractable Resource
  const a3d = raw.annexure_3d_district_extractable_resource || [];
  const rows3d = a3d.map((r: any) => ({
    year,
    serial_no: r.serial_no ? Math.round(r.serial_no) : null,
    state: r.state,
    district: r.district,
    total_extractable_resource_ham: r.total_extractable_resource_ham,
    safe_resource_ham: safe(r, "safe", "resource_ham"),
    safe_percent: safe(r, "safe", "percent"),
    semi_critical_resource_ham: safe(r, "semi_critical", "resource_ham"),
    semi_critical_percent: safe(r, "semi_critical", "percent"),
    critical_resource_ham: safe(r, "critical", "resource_ham"),
    critical_percent: safe(r, "critical", "percent"),
    over_exploited_resource_ham: safe(r, "over_exploited", "resource_ham"),
    over_exploited_percent: safe(r, "over_exploited", "percent"),
    saline_resource_ham: safe(r, "saline", "resource_ham"),
    saline_percent: safe(r, "saline", "percent"),
  }));
  if (rows3d.length > 0) {
    await db.insert(annexure3d).values(rows3d);
    console.log(`  Inserted ${rows3d.length} annexure3d records`);
  }

  // 3E - State Area Categorization
  const a3e = raw.annexure_3e_state_area_categorization || [];
  const rows3e = a3e.map((r: any) => ({
    year,
    serial_no: r.serial_no ? Math.round(r.serial_no) : null,
    state: r.state,
    total_geographical_area_sq_km: r.total_geographical_area_sq_km,
    recharge_worthy_area_sq_km: r.recharge_worthy_area_sq_km,
    safe_area_sq_km: safe(r, "safe", "area_sq_km"),
    safe_percent: safe(r, "safe", "percent"),
    semi_critical_area_sq_km: safe(r, "semi_critical", "area_sq_km"),
    semi_critical_percent: safe(r, "semi_critical", "percent"),
    critical_area_sq_km: safe(r, "critical", "area_sq_km"),
    critical_percent: safe(r, "critical", "percent"),
    over_exploited_area_sq_km: safe(r, "over_exploited", "area_sq_km"),
    over_exploited_percent: safe(r, "over_exploited", "percent"),
    saline_area_sq_km: safe(r, "saline", "area_sq_km"),
    saline_percent: safe(r, "saline", "percent"),
  }));
  if (rows3e.length > 0) {
    await db.insert(annexure3e).values(rows3e);
    console.log(`  Inserted ${rows3e.length} annexure3e records`);
  }

  // 3F - District Area Categorization
  const a3f = raw.annexure_3f_district_area_categorization || [];
  const rows3f = a3f.map((r: any) => ({
    year,
    serial_no: r.serial_no ? Math.round(r.serial_no) : null,
    state: r.state,
    district: r.district,
    total_recharge_worthy_area_sq_km: r.total_recharge_worthy_area_sq_km,
    safe_area_sq_km: safe(r, "safe", "area_sq_km"),
    safe_percent: safe(r, "safe", "percent"),
    semi_critical_area_sq_km: safe(r, "semi_critical", "area_sq_km"),
    semi_critical_percent: safe(r, "semi_critical", "percent"),
    critical_area_sq_km: safe(r, "critical", "area_sq_km"),
    critical_percent: safe(r, "critical", "percent"),
    over_exploited_area_sq_km: safe(r, "over_exploited", "area_sq_km"),
    over_exploited_percent: safe(r, "over_exploited", "percent"),
    saline_area_sq_km: safe(r, "saline", "area_sq_km"),
    saline_percent: safe(r, "saline", "percent"),
  }));
  if (rows3f.length > 0) {
    await db.insert(annexure3f).values(rows3f);
    console.log(`  Inserted ${rows3f.length} annexure3f records`);
  }
}

// ========== ANNEXURE 4 LOADER ==========
async function loadAnnexure4(filePath: string) {
  console.log(`Loading annexure4: ${filePath}`);
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const year = raw.year;

  // 4A - Categorized Units
  const a4a = raw.annexure_4a_categorized_units || [];
  const rows4a = a4a.map((r: any) => ({
    year,
    state: r.state,
    district: r.district,
    semi_critical_unit: r.semi_critical_unit || null,
    critical_unit: r.critical_unit || null,
    over_exploited_unit: r.over_exploited_unit || null,
  }));
  if (rows4a.length > 0) {
    await db.insert(annexure4a).values(rows4a);
    console.log(`  Inserted ${rows4a.length} annexure4a records`);
  }

  // 4B - Quality Problems
  const a4b = raw.annexure_4b_quality_problems || [];
  const rows4b = a4b.map((r: any) => ({
    year,
    state: r.state,
    district: r.district,
    fluoride_affected_unit: r.fluoride_affected_unit || null,
    arsenic_affected_unit: r.arsenic_affected_unit || null,
    salinity_affected_unit: r.salinity_affected_unit || null,
  }));
  if (rows4b.length > 0) {
    await db.insert(annexure4b).values(rows4b);
    console.log(`  Inserted ${rows4b.length} annexure4b records`);
  }
}

// ========== MAIN LOADER ==========
const dataRoot = path.join(__dirname, "../../../output");

async function clearAllTables() {
  console.log("Clearing existing data...");
  await db.delete(annexure4b);
  await db.delete(annexure4a);
  await db.delete(annexure3f);
  await db.delete(annexure3e);
  await db.delete(annexure3d);
  await db.delete(annexure3c);
  await db.delete(annexure3b);
  await db.delete(annexure3a);
  await db.delete(annexure2);
  await db.delete(annexure1);
  await db.delete(attributeDetailed);
  await db.delete(attributeSummary);
  await db.delete(centralReport);
  await db.delete(stateReport);
  console.log("All tables cleared.\n");
}

async function loadAll() {
  console.log("Starting data load...\n");

  try {
    // Clear existing data first
    await clearAllTables();
    // State reports
    console.log("=== Loading State Reports ===");
    const stateDir = path.join(dataRoot, "state_reports");
    if (fs.existsSync(stateDir)) {
      const stateFiles = fs.readdirSync(stateDir).filter((f) => f.endsWith(".json"));
      for (const file of stateFiles) {
        await loadStateReport(path.join(stateDir, file));
      }
    }

    // Central reports
    console.log("\n=== Loading Central Reports ===");
    const centralDir = path.join(dataRoot, "central_reports");
    if (fs.existsSync(centralDir)) {
      const centralFiles = fs.readdirSync(centralDir).filter((f) => f.endsWith(".json"));
      for (const file of centralFiles) {
        await loadCentralReport(path.join(centralDir, file));
      }
    }

    // Attribute reports
    console.log("\n=== Loading Attribute Reports ===");
    const attrDir = path.join(dataRoot, "attribute_reports");
    if (fs.existsSync(attrDir)) {
      const attrFiles = fs.readdirSync(attrDir).filter((f) => f.endsWith(".json"));
      for (const file of attrFiles) {
        await loadAttributeReport(path.join(attrDir, file));
      }
    }

    // Annexures
    console.log("\n=== Loading Annexures ===");
    const annexDir = path.join(dataRoot, "annexures");
    if (fs.existsSync(annexDir)) {
      const annexFiles = fs.readdirSync(annexDir).filter((f) => f.endsWith(".json"));
      for (const file of annexFiles) {
        if (file.startsWith("annexure1")) {
          await loadAnnexure1(path.join(annexDir, file));
        } else if (file.startsWith("annexure2")) {
          await loadAnnexure2(path.join(annexDir, file));
        } else if (file.startsWith("annexure3")) {
          await loadAnnexure3(path.join(annexDir, file));
        } else if (file.startsWith("annexure4")) {
          await loadAnnexure4(path.join(annexDir, file));
        }
      }
    }

    console.log("\n✅ All data loaded successfully!");
  } catch (error) {
    console.error("❌ Error loading data:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

loadAll();
