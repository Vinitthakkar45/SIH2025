"""
State Report ETL Pipeline - Complete Version
=============================================
Converts all State Report Excel files to properly structured JSON.

Column Naming Convention:
- C  → contaminated (areas exceeding permissible limits)
- NC → non_contaminated (areas within acceptable limits)
- PQ → poor_quality (areas with significant quality issues)

Based on actual Excel structure with 162 columns:
- Columns 0-4: Basic info (S.No, State, District, Assessment Unit, Watershed)
- Columns 5-8: Rainfall (C, NC, PQ, Total)
- Columns 9-14: Total Geographical Area
- Columns 15-50: Ground Water Recharge
- Columns 51-82: Inflows and Outflows
- Columns 83-86: Annual Ground Water Recharge
- Columns 87-90: Environmental Flows
- Columns 91-94: Annual Extractable GW Resource
- Columns 95-110: Ground Water Extraction for all uses
- Columns 111-114: Stage of Ground Water Extraction
- Columns 115-118: Categorization
- Columns 119-122: Pre/Post Monsoon Trends
- Columns 123-130: Allocation & Net Availability
- Columns 131-136: Quality Tagging
- Columns 137-161: Additional Resources & Confined/Semi-Confined data
"""

import os
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
import openpyxl
import warnings

warnings.filterwarnings("ignore")

# Configuration
DATA_DIR = Path(__file__).parent.parent / "data"
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "state_reports"


def extract_year_from_filename(filename: str) -> str:
    """Extract year from filename"""
    patterns = [r"(\d{4}-\d{4})", r"(\d{4}-\d{2})"]
    for pattern in patterns:
        match = re.search(pattern, filename)
        if match:
            year = match.group(1)
            if len(year) == 7:  # 2024-25 → 2024-2025
                year = year[:4] + "-20" + year[5:]
            return year
    return "unknown"


def extract_state_from_filename(filename: str) -> str:
    """Extract state name from filename"""
    name = filename.replace(".xlsx", "").replace(".xls", "")
    if "stateReport" in name:
        state = name.replace("stateReport", "").replace("Hydro", "").strip()
        state = re.sub(r"\d{4}-\d{4}", "", state)
        state = re.sub(r"\d{4}-\d{2}", "", state)
        # Add spaces before capitals
        state = re.sub(r"([a-z])([A-Z])", r"\1 \2", state)
        return state.strip()
    return "Unknown"


def safe_float(value, default: float = 0.0) -> float:
    """Safely convert to float, returns 0 if invalid (better for LLM calculations)"""
    if value is None or value == "" or str(value).lower() in ["none", "nan", ""]:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def safe_str(value) -> Optional[str]:
    """Safely convert to string"""
    if value is None or value == "" or str(value).lower() == "none":
        return None
    return str(value).strip()


def get_cnc_pq(row: tuple, start: int) -> Dict:
    """
    Get C/NC/PQ/Total values as structured dict.
    Converts abbreviated names to full readable names.
    Returns 0 for missing values (better for LLM calculations).
    """
    return {
        "contaminated": safe_float(row[start]) if start < len(row) else 0.0,
        "non_contaminated": safe_float(row[start + 1]) if start + 1 < len(row) else 0.0,
        "poor_quality": safe_float(row[start + 2]) if start + 2 < len(row) else 0.0,
        "total": safe_float(row[start + 3]) if start + 3 < len(row) else 0.0,
    }


def get_fresh_saline(row: tuple, start: int) -> Dict:
    """Get Fresh/Saline values. Returns 0 for missing values."""
    return {
        "fresh": safe_float(row[start]) if start < len(row) else 0.0,
        "saline": safe_float(row[start + 1]) if start + 1 < len(row) else 0.0,
    }


def parse_row_to_record(row: tuple, state_name: str, year: str) -> Optional[Dict]:
    """
    Parse a single data row into structured JSON format.
    Complete mapping of all 162 columns.
    """
    if not row or len(row) < 10:
        return None

    # Check if valid data row (should have numeric S.No)
    try:
        serial = float(row[0]) if row[0] else None
        if serial is None:
            return None
    except (ValueError, TypeError):
        return None

    # Skip "Total" rows
    if safe_str(row[0]) == "Total":
        return None

    record = {
        # === BASIC INFO (cols 0-4) ===
        "serial_no": int(serial) if serial else None,
        "state": safe_str(row[1]) or state_name,
        "district": safe_str(row[2]),
        "assessment_unit": safe_str(row[3]),  # Could be Block name
        "watershed_district": safe_str(row[4]),
        "year": year,
        # === RAINFALL (cols 5-8) ===
        "rainfall_mm": get_cnc_pq(row, 5),
        # === TOTAL GEOGRAPHICAL AREA (ha) (cols 9-14) ===
        "geographical_area_ha": {
            "recharge_worthy": get_cnc_pq(row, 9),
            "hilly_area": safe_float(row[13]) if len(row) > 13 else 0.0,
            "total": safe_float(row[14]) if len(row) > 14 else 0.0,
        },
        # === GROUND WATER RECHARGE (ham) (cols 15-50) ===
        "ground_water_recharge_ham": {
            "rainfall_recharge": get_cnc_pq(row, 15),
            "canals": get_cnc_pq(row, 19),
            "surface_water_irrigation": get_cnc_pq(row, 23),
            "ground_water_irrigation": get_cnc_pq(row, 27),
            "tanks_and_ponds": get_cnc_pq(row, 31),
            "water_conservation_structure": get_cnc_pq(row, 35),
            "pipelines": get_cnc_pq(row, 39),
            "sewages_flash_flood_channels": get_cnc_pq(row, 43),
            # Total C, NC, PQ, Total (cols 47-50)
            "subtotal": {
                "contaminated": safe_float(row[47]) if len(row) > 47 else 0.0,
                "non_contaminated": safe_float(row[48]) if len(row) > 48 else 0.0,
                "poor_quality": safe_float(row[49]) if len(row) > 49 else 0.0,
                "total": safe_float(row[50]) if len(row) > 50 else 0.0,
            },
        },
        # === INFLOWS AND OUTFLOWS (ham) (cols 51-82) ===
        "inflows_outflows_ham": {
            "base_flow": get_cnc_pq(row, 51),
            "stream_recharges": get_cnc_pq(row, 55),
            "lateral_flows": get_cnc_pq(row, 59),
            "vertical_flows": get_cnc_pq(row, 63),
            "evaporation": get_cnc_pq(row, 67),
            "transpiration": get_cnc_pq(row, 71),
            "evapotranspiration": get_cnc_pq(row, 75),
            # Total (cols 79-82)
            "subtotal": {
                "contaminated": safe_float(row[79]) if len(row) > 79 else 0.0,
                "non_contaminated": safe_float(row[80]) if len(row) > 80 else 0.0,
                "poor_quality": safe_float(row[81]) if len(row) > 81 else 0.0,
                "total": safe_float(row[82]) if len(row) > 82 else 0.0,
            },
        },
        # === ANNUAL GROUND WATER RECHARGE (ham) (cols 83-86) ===
        "annual_gw_recharge_ham": get_cnc_pq(row, 83),
        # === ENVIRONMENTAL FLOWS (ham) (cols 87-90) ===
        "environmental_flows_ham": get_cnc_pq(row, 87),
        # === ANNUAL EXTRACTABLE GW RESOURCE (ham) (cols 91-94) ===
        "annual_extractable_gw_resource_ham": get_cnc_pq(row, 91),
        # === GW EXTRACTION FOR ALL USES (ham) (cols 95-110) ===
        "gw_extraction_ham": {
            "domestic": get_cnc_pq(row, 95),
            "industrial": get_cnc_pq(row, 99),
            "irrigation": get_cnc_pq(row, 103),
            # Total (cols 107-110)
            "total": {
                "contaminated": safe_float(row[107]) if len(row) > 107 else 0.0,
                "non_contaminated": safe_float(row[108]) if len(row) > 108 else 0.0,
                "poor_quality": safe_float(row[109]) if len(row) > 109 else 0.0,
                "total": safe_float(row[110]) if len(row) > 110 else 0.0,
            },
        },
        # === STAGE OF GW EXTRACTION (%) (cols 111-114) ===
        "stage_of_extraction_percent": get_cnc_pq(row, 111),
        # === CATEGORIZATION (cols 115-118) ===
        # Values: Safe, Semi-Critical, Critical, Over-Exploited
        "categorization": {
            "contaminated": safe_str(row[115]) if len(row) > 115 else None,
            "non_contaminated": safe_str(row[116]) if len(row) > 116 else None,
            "poor_quality": safe_str(row[117]) if len(row) > 117 else None,
            "overall": safe_str(row[118]) if len(row) > 118 else None,
        },
        # === GW TRENDS (cols 119-122) ===
        "gw_trends": {
            "pre_monsoon": {
                "contaminated": safe_str(row[119]) if len(row) > 119 else None,
                "non_contaminated": safe_str(row[120]) if len(row) > 120 else None,
            },
            "post_monsoon": {
                "contaminated": safe_str(row[121]) if len(row) > 121 else None,
                "non_contaminated": safe_str(row[122]) if len(row) > 122 else None,
            },
        },
        # === ALLOCATION FOR DOMESTIC USE 2025 (ham) (cols 123-126) ===
        "allocation_domestic_2025_ham": get_cnc_pq(row, 123),
        # === NET ANNUAL GW AVAILABILITY FOR FUTURE (ham) (cols 127-130) ===
        "net_annual_gw_availability_ham": get_cnc_pq(row, 127),
        # === QUALITY TAGGING (cols 131-136) ===
        "quality_tagging": {
            "major_parameter": {
                "contaminated": safe_str(row[131]) if len(row) > 131 else None,
                "non_contaminated": safe_str(row[132]) if len(row) > 132 else None,
                "poor_quality": safe_str(row[133]) if len(row) > 133 else None,
            },
            "other_parameters": {
                "contaminated": safe_str(row[134]) if len(row) > 134 else None,
                "non_contaminated": safe_str(row[135]) if len(row) > 135 else None,
                "poor_quality": safe_str(row[136]) if len(row) > 136 else None,
            },
        },
        # === ADDITIONAL POTENTIAL RESOURCES (cols 137-139) ===
        "additional_potential_resources_ham": {
            "waterlogged_shallow_water_table": safe_float(row[137])
            if len(row) > 137
            else 0.0,
            "flood_prone": safe_float(row[138]) if len(row) > 138 else 0.0,
            "spring_discharge": safe_float(row[139]) if len(row) > 139 else 0.0,
        },
        # === COASTAL AREAS (cols 140-143) ===
        "coastal_areas": get_cnc_pq(row, 140),
        # === IN-STORAGE UNCONFINED GW (cols 144-145) ===
        "in_storage_unconfined_gw_ham": get_fresh_saline(row, 144),
        # === TOTAL GW AVAILABILITY UNCONFINED (cols 146-147) ===
        "total_gw_availability_unconfined_ham": get_fresh_saline(row, 146),
        # === DYNAMIC CONFINED GW (cols 148-149) ===
        "dynamic_confined_gw_ham": get_fresh_saline(row, 148),
        # === IN-STORAGE CONFINED GW (cols 150-151) ===
        "in_storage_confined_gw_ham": get_fresh_saline(row, 150),
        # === TOTAL CONFINED GW (cols 152-153) ===
        "total_confined_gw_ham": get_fresh_saline(row, 152),
        # === DYNAMIC SEMI-CONFINED GW (cols 154-155) ===
        "dynamic_semi_confined_gw_ham": get_fresh_saline(row, 154),
        # === IN-STORAGE SEMI-CONFINED GW (cols 156-157) ===
        "in_storage_semi_confined_gw_ham": get_fresh_saline(row, 156),
        # === TOTAL SEMI-CONFINED GW (cols 158-159) ===
        "total_semi_confined_gw_ham": get_fresh_saline(row, 158),
        # === TOTAL GW AVAILABILITY IN AREA (cols 160-161) ===
        "total_gw_availability_ham": get_fresh_saline(row, 160),
    }

    return record


def extract_state_report(filepath: Path) -> Tuple[str, str, List[Dict]]:
    """Extract all data from a state report Excel file"""
    state = extract_state_from_filename(filepath.name)
    year = extract_year_from_filename(filepath.name)

    print(f"  Processing: {state} ({year})")

    wb = openpyxl.load_workbook(filepath, data_only=True)
    ws = wb.active

    records = []

    # Data typically starts at row 12 (after headers and metadata)
    for row_num, row in enumerate(ws.iter_rows(min_row=12, values_only=True), 12):
        record = parse_row_to_record(row, state, year)
        if record and record.get("district"):
            records.append(record)

    wb.close()

    print(f"    → Extracted {len(records)} assessment units")
    return state, year, records


def process_all_state_reports():
    """Main function to process all state report files"""

    print("=" * 70)
    print("STATE REPORT ETL PIPELINE")
    print("=" * 70)
    print("""
Field Naming Convention:
  • C  → contaminated (exceeds permissible limits)
  • NC → non_contaminated (within acceptable limits)
  • PQ → poor_quality (significant quality issues)
  • ham → hectare meters (1 ham = 10,000 cubic meters)
""")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Find state report files
    state_report_files = sorted([f for f in DATA_DIR.glob("stateReport*.xlsx")])
    print(f"Found {len(state_report_files)} state report files\n")

    # Master data structure
    master_data = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "source": "Central Ground Water Board (CGWB) State Reports",
            "data_type": "state_reports",
            "years_covered": [],
            "states_covered": [],
            "total_records": 0,
            "units": {
                "rainfall": "mm (millimeters)",
                "area": "ha (hectares)",
                "volume": "ham (hectare meters = 10,000 cubic meters)",
            },
            "quality_classification": {
                "contaminated": "C - Areas where groundwater quality exceeds permissible limits for certain parameters",
                "non_contaminated": "NC - Areas where groundwater quality is within acceptable limits",
                "poor_quality": "PQ - Areas with significant quality issues",
            },
            "category_definitions": {
                "Safe": "Stage of extraction < 70%",
                "Semi-Critical": "Stage of extraction 70-90%",
                "Critical": "Stage of extraction 90-100%",
                "Over-Exploited": "Stage of extraction > 100%",
            },
        },
        "data": {},
    }

    years_set = set()
    states_set = set()
    total_records = 0

    for i, filepath in enumerate(state_report_files, 1):
        print(f"[{i}/{len(state_report_files)}] {filepath.name}")

        try:
            state, year, records = extract_state_report(filepath)

            if not records:
                print(f"    ⚠ No records found")
                continue

            # Initialize nested structure
            if state not in master_data["data"]:
                master_data["data"][state] = {}

            master_data["data"][state][year] = records

            years_set.add(year)
            states_set.add(state)
            total_records += len(records)

            # Save individual file
            individual_file = OUTPUT_DIR / f"{state.replace(' ', '_')}_{year}.json"
            with open(individual_file, "w", encoding="utf-8") as f:
                json.dump(
                    {
                        "state": state,
                        "year": year,
                        "record_count": len(records),
                        "data": records,
                    },
                    f,
                    indent=2,
                    ensure_ascii=False,
                )

        except Exception as e:
            print(f"    ✗ Error: {str(e)}")
            import traceback

            traceback.print_exc()

    # Update metadata
    master_data["metadata"]["years_covered"] = sorted(list(years_set))
    master_data["metadata"]["states_covered"] = sorted(list(states_set))
    master_data["metadata"]["total_records"] = total_records

    # Save master file
    master_file = OUTPUT_DIR / "all_state_reports_master.json"
    print(f"\nSaving master dataset...")
    with open(master_file, "w", encoding="utf-8") as f:
        json.dump(master_data, f, indent=2, ensure_ascii=False)

    # Print summary
    print("\n" + "=" * 70)
    print("✓ EXTRACTION COMPLETE!")
    print("=" * 70)
    print(f"""
Summary:
  • Files processed: {len(state_report_files)}
  • States: {len(states_set)}
  • Years: {sorted(list(years_set))}
  • Total records: {total_records}

Output Location:
  • Individual files: {OUTPUT_DIR}/<State>_<Year>.json
  • Master dataset: {master_file}
""")

    return master_data


if __name__ == "__main__":
    process_all_state_reports()
