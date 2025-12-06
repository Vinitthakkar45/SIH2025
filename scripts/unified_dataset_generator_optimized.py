"""
Optimized Unified Dataset Generator for Groundwater RAG System
===============================================================

This script normalizes all groundwater reports into a unified JSONL format
optimized for RAG (Retrieval Augmented Generation).

Key optimization: Instead of flattening every sub-metric (contaminated/non-contaminated/etc),
we focus on TOTAL values and key aggregates that are most useful for queries.

This generates ~20,000-80,000 records instead of millions.

Output Schema:
{
    "id": "unique_identifier",
    "state": "state_name",
    "district": "district_name or null",
    "block": "block/assessment_unit or null",
    "year": "YYYY-YYYY",
    "metric": "metric_name",
    "value": numeric_or_string_value,
    "unit": "ham/bcm/mm/percent/etc",
    "category": "high_level_category",
    "categorization": "safe/critical/etc",
    "source": "relative_path_to_source_file",
    "source_type": "state_report/central_report/etc",
    "text": "Human-readable sentence for embedding"
}
"""

import json
import os
import hashlib
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional, Tuple
from datetime import datetime


# ============================================================================
# CONFIGURATION
# ============================================================================

BASE_DIR = Path(__file__).parent.parent / "output"
OUTPUT_FILE = BASE_DIR / "unified_dataset.jsonl"

# Unit descriptions for natural language
UNIT_NAMES = {
    "ham": "hectare meters",
    "bcm": "billion cubic meters",
    "mm": "millimeters",
    "ha": "hectares",
    "sq_km": "square kilometers",
    "percent": "percent",
    "count": "units",
    "": "",
}


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================


def generate_id(state: str, district: str, block: str, year: str, metric: str) -> str:
    """Generate deterministic ID based on content."""
    content = f"{state}|{district}|{block}|{year}|{metric}"
    return hashlib.md5(content.encode()).hexdigest()[:12]


def title_case(text: str) -> str:
    """Convert text to title case."""
    if not text:
        return text
    if text.isupper():
        return text.title()
    return text


def clean_state_name(state: str) -> str:
    """Normalize state name for consistency."""
    if not state:
        return state
    state = str(state).strip()
    if state.isupper():
        state = state.title()

    replacements = {
        "Andman Nicobar": "Andaman and Nicobar Islands",
        "Andaman And Nicobar Islands": "Andaman and Nicobar Islands",
        "Jammu And Kashmir": "Jammu and Kashmir",
        "Jammu Kashmir": "Jammu and Kashmir",
        "Dadra And Nagar Haveli": "Dadra and Nagar Haveli",
        "Daman And Diu": "Daman and Diu",
        "Damandiu": "Daman and Diu",
        "Lakshdweep": "Lakshadweep",
        "Kerela": "Kerala",
        "Telengana": "Telangana",
        "Tamilnadu": "Tamil Nadu",
        "Arunachal": "Arunachal Pradesh",
    }
    for old, new in replacements.items():
        if state.lower() == old.lower():
            return new
    return state


def clean_district_name(district: str) -> str:
    """Normalize district name."""
    if not district:
        return None
    district = str(district).strip()
    if not district or district.lower() == "null":
        return None
    if district.isupper():
        district = district.title()
    return district


def clean_block_name(block: str) -> str:
    """Normalize block/assessment unit name."""
    if not block:
        return None
    block = str(block).strip()
    if not block or block.lower() == "null":
        return None
    if block.isupper():
        block = block.title()
    return block


def get_nested_value(obj: dict, *keys, default=None):
    """Safely get nested dictionary value."""
    for key in keys:
        if isinstance(obj, dict) and key in obj:
            obj = obj[key]
        else:
            return default
    return obj


def format_value(value: Any) -> str:
    """Format value for display."""
    if value is None:
        return "N/A"
    if isinstance(value, float):
        if value == int(value):
            return str(int(value))
        return f"{value:.2f}"
    return str(value)


def generate_text(
    state: str,
    district: Optional[str],
    block: Optional[str],
    year: str,
    metric_desc: str,
    value: Any,
    unit: str = "",
) -> str:
    """Generate human-readable text for RAG embedding."""

    # Build location string
    if block and district:
        location = f"{block} block of {district} district, {state}"
    elif district:
        location = f"{district} district, {state}"
    else:
        location = state

    value_str = format_value(value)
    unit_name = UNIT_NAMES.get(unit, unit)

    # Handle different types
    if isinstance(value, str) and not value.replace(".", "").replace("-", "").isdigit():
        return f"In {location} ({year}), {metric_desc} is {value}."
    elif "count" in unit or "units" in metric_desc.lower():
        return f"{state} has {value_str} {metric_desc} as per the {year} groundwater assessment."
    elif unit == "percent":
        return f"In {location} ({year}), {metric_desc} is {value_str}%."
    elif unit_name:
        return f"In {location} ({year}), {metric_desc} is {value_str} {unit_name}."
    else:
        return f"In {location} ({year}), {metric_desc} is {value_str}."


def create_record(
    state: str,
    district: Optional[str],
    block: Optional[str],
    year: str,
    metric: str,
    value: Any,
    unit: str,
    category: str,
    source: str,
    source_type: str,
    metric_desc: str,
    categorization: Optional[str] = None,
) -> Optional[Dict]:
    """Create a unified record if value is valid."""
    if value is None or value == "" or (isinstance(value, str) and value.strip() == ""):
        return None

    # Skip zero values for most metrics to reduce noise
    if isinstance(value, (int, float)) and value == 0:
        # Keep zeros only for important metrics
        important_zero_metrics = [
            "over_exploited_count",
            "critical_count",
            "saline_count",
            "stage_of_extraction",
            "categorization",
        ]
        if not any(m in metric.lower() for m in important_zero_metrics):
            return None

    return {
        "id": generate_id(state, district or "", block or "", year, metric),
        "state": state,
        "district": district,
        "block": block,
        "year": year,
        "metric": metric,
        "value": value,
        "unit": unit,
        "category": category,
        "categorization": categorization,
        "source": source,
        "source_type": source_type,
        "text": generate_text(state, district, block, year, metric_desc, value, unit),
    }


# ============================================================================
# NORMALIZERS - OPTIMIZED TO EXTRACT KEY METRICS ONLY
# ============================================================================


def normalize_state_report(filepath: Path) -> Generator[Dict, None, None]:
    """
    Normalize state report - extract key metrics per block.

    Focus on: rainfall_total, annual_recharge, extraction, categorization
    """
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    state = clean_state_name(data.get("state", ""))
    year = data.get("year", "")
    source = f"state_reports/{filepath.name}"

    for record in data.get("data", []):
        district = clean_district_name(record.get("district"))
        block = clean_block_name(record.get("assessment_unit"))

        # Get categorization
        cat_obj = record.get("categorization", {})
        categorization = None
        if isinstance(cat_obj, dict):
            categorization = cat_obj.get("overall") or cat_obj.get("non_contaminated")
        elif isinstance(cat_obj, str):
            categorization = cat_obj

        # Key metrics to extract
        metrics = [
            # Rainfall
            (
                "rainfall_total_mm",
                get_nested_value(record, "rainfall_mm", "total"),
                "mm",
                "rainfall",
                "total rainfall",
            ),
            # Geographical Area
            (
                "geographical_area_total_ha",
                get_nested_value(record, "geographical_area_ha", "total"),
                "ha",
                "geographical_area",
                "total geographical area",
            ),
            (
                "recharge_worthy_area_ha",
                get_nested_value(
                    record, "geographical_area_ha", "recharge_worthy", "total"
                ),
                "ha",
                "geographical_area",
                "recharge-worthy area",
            ),
            # Groundwater Recharge
            (
                "gw_recharge_from_rainfall_ham",
                get_nested_value(
                    record, "ground_water_recharge_ham", "rainfall_recharge", "total"
                ),
                "ham",
                "groundwater_recharge",
                "groundwater recharge from rainfall",
            ),
            (
                "gw_recharge_total_ham",
                get_nested_value(
                    record, "ground_water_recharge_ham", "subtotal", "total"
                ),
                "ham",
                "groundwater_recharge",
                "total groundwater recharge",
            ),
            # Annual Resources
            (
                "annual_gw_recharge_ham",
                get_nested_value(record, "annual_gw_recharge_ham", "total"),
                "ham",
                "annual_resources",
                "annual groundwater recharge",
            ),
            (
                "annual_extractable_gw_ham",
                get_nested_value(record, "annual_extractable_gw_resource_ham", "total"),
                "ham",
                "annual_resources",
                "annual extractable groundwater resource",
            ),
            (
                "environmental_flows_ham",
                get_nested_value(record, "environmental_flows_ham", "total"),
                "ham",
                "annual_resources",
                "environmental flow requirement",
            ),
            # Extraction
            (
                "gw_extraction_irrigation_ham",
                get_nested_value(record, "gw_extraction_ham", "irrigation", "total"),
                "ham",
                "extraction",
                "groundwater extraction for irrigation",
            ),
            (
                "gw_extraction_domestic_ham",
                get_nested_value(record, "gw_extraction_ham", "domestic", "total"),
                "ham",
                "extraction",
                "groundwater extraction for domestic use",
            ),
            (
                "gw_extraction_industrial_ham",
                get_nested_value(record, "gw_extraction_ham", "industrial", "total"),
                "ham",
                "extraction",
                "groundwater extraction for industrial use",
            ),
            (
                "gw_extraction_total_ham",
                get_nested_value(record, "gw_extraction_ham", "total", "total"),
                "ham",
                "extraction",
                "total groundwater extraction",
            ),
            # Stage of Extraction
            (
                "stage_of_extraction_percent",
                get_nested_value(record, "stage_of_extraction_percent", "total"),
                "percent",
                "extraction_status",
                "stage of groundwater extraction",
            ),
            # Net Availability
            (
                "net_gw_availability_ham",
                get_nested_value(record, "net_annual_gw_availability_ham", "total"),
                "ham",
                "availability",
                "net annual groundwater availability",
            ),
            (
                "allocation_domestic_2025_ham",
                get_nested_value(record, "allocation_domestic_2025_ham", "total"),
                "ham",
                "allocation",
                "domestic allocation projected for 2025",
            ),
            # Categorization
            (
                "categorization_status",
                categorization,
                "",
                "status",
                "groundwater status category",
            ),
            # GW Trends
            (
                "gw_trend_pre_monsoon",
                get_nested_value(
                    record, "gw_trends", "pre_monsoon", "non_contaminated"
                ),
                "",
                "trends",
                "pre-monsoon groundwater trend",
            ),
            (
                "gw_trend_post_monsoon",
                get_nested_value(
                    record, "gw_trends", "post_monsoon", "non_contaminated"
                ),
                "",
                "trends",
                "post-monsoon groundwater trend",
            ),
            # Storage
            (
                "in_storage_fresh_ham",
                get_nested_value(record, "in_storage_unconfined_gw_ham", "fresh"),
                "ham",
                "storage",
                "fresh groundwater in storage",
            ),
            (
                "total_gw_availability_fresh_ham",
                get_nested_value(record, "total_gw_availability_ham", "fresh"),
                "ham",
                "availability",
                "total fresh groundwater availability",
            ),
        ]

        for metric, value, unit, category, desc in metrics:
            rec = create_record(
                state,
                district,
                block,
                year,
                metric,
                value,
                unit,
                category,
                source,
                "state_report",
                desc,
                categorization,
            )
            if rec:
                yield rec


def normalize_central_report(filepath: Path) -> Generator[Dict, None, None]:
    """
    Normalize central report - extract key metrics per district.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    year = data.get("year", "")
    source = f"central_reports/{filepath.name}"

    for record in data.get("records", []):
        state = clean_state_name(record.get("state", ""))
        district = clean_district_name(record.get("district"))
        categorization = record.get("categorization")

        metrics = [
            # Rainfall
            (
                "rainfall_total_mm",
                get_nested_value(record, "rainfall_mm", "total"),
                "mm",
                "rainfall",
                "total rainfall",
            ),
            # Geographical Area
            (
                "geographical_area_total_ha",
                get_nested_value(record, "total_geographical_area_ha", "total"),
                "ha",
                "geographical_area",
                "total geographical area",
            ),
            (
                "recharge_worthy_area_ha",
                get_nested_value(
                    record,
                    "total_geographical_area_ha",
                    "recharge_worthy_area",
                    "total",
                ),
                "ha",
                "geographical_area",
                "recharge-worthy area",
            ),
            # Recharge
            (
                "gw_recharge_from_rainfall_ham",
                get_nested_value(
                    record, "ground_water_recharge_ham", "rainfall_recharge", "total"
                ),
                "ham",
                "groundwater_recharge",
                "groundwater recharge from rainfall",
            ),
            (
                "total_annual_recharge_ham",
                record.get("total_annual_recharge_ham"),
                "ham",
                "groundwater_recharge",
                "total annual groundwater recharge",
            ),
            (
                "recharge_other_sources_monsoon_ham",
                record.get("recharge_from_other_sources_monsoon_ham"),
                "ham",
                "groundwater_recharge",
                "monsoon recharge from other sources",
            ),
            (
                "recharge_rainfall_non_monsoon_ham",
                record.get("recharge_from_rainfall_non_monsoon_ham"),
                "ham",
                "groundwater_recharge",
                "non-monsoon rainfall recharge",
            ),
            # Resources & Extraction
            (
                "natural_discharge_ham",
                record.get("natural_discharge_ham"),
                "ham",
                "discharge",
                "natural groundwater discharge",
            ),
            (
                "annual_extractable_resource_ham",
                record.get("annual_extractable_resource_ham"),
                "ham",
                "resources",
                "annual extractable groundwater resource",
            ),
            (
                "extraction_irrigation_ham",
                get_nested_value(record, "current_extraction_ham", "irrigation"),
                "ham",
                "extraction",
                "groundwater extraction for irrigation",
            ),
            (
                "extraction_domestic_ham",
                get_nested_value(record, "current_extraction_ham", "domestic"),
                "ham",
                "extraction",
                "groundwater extraction for domestic use",
            ),
            (
                "extraction_industrial_ham",
                get_nested_value(record, "current_extraction_ham", "industrial"),
                "ham",
                "extraction",
                "groundwater extraction for industrial use",
            ),
            (
                "extraction_total_ham",
                get_nested_value(record, "current_extraction_ham", "total"),
                "ham",
                "extraction",
                "total groundwater extraction",
            ),
            # Status
            (
                "stage_of_extraction_percent",
                record.get("stage_of_extraction_percent"),
                "percent",
                "status",
                "stage of groundwater extraction",
            ),
            (
                "categorization_status",
                categorization,
                "",
                "status",
                "groundwater status category",
            ),
        ]

        for metric, value, unit, category, desc in metrics:
            rec = create_record(
                state,
                district,
                None,
                year,
                metric,
                value,
                unit,
                category,
                source,
                "central_report",
                desc,
                categorization,
            )
            if rec:
                yield rec


def normalize_attribute_report(filepath: Path) -> Generator[Dict, None, None]:
    """
    Normalize attribute report - summary and detailed tables.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    year = data.get("year", "")
    source = f"attribute_reports/{filepath.name}"

    # Summary table (state-level counts)
    for record in data.get("summary", []):
        state = clean_state_name(record.get("state", ""))

        metrics = [
            (
                "over_exploited_units_count",
                record.get("over_exploited_count"),
                "count",
                "categorization_summary",
                "over-exploited groundwater units",
            ),
            (
                "safe_units_count",
                record.get("safe_count"),
                "count",
                "categorization_summary",
                "safe groundwater units",
            ),
            (
                "critical_units_count",
                record.get("critical_count"),
                "count",
                "categorization_summary",
                "critical groundwater units",
            ),
            (
                "semi_critical_units_count",
                record.get("semi_critical_count"),
                "count",
                "categorization_summary",
                "semi-critical groundwater units",
            ),
            (
                "saline_units_count",
                record.get("saline_count"),
                "count",
                "categorization_summary",
                "saline groundwater units",
            ),
            (
                "total_assessed_units_count",
                record.get("total_count"),
                "count",
                "categorization_summary",
                "total assessed groundwater units",
            ),
        ]

        for metric, value, unit, category, desc in metrics:
            rec = create_record(
                state,
                None,
                None,
                year,
                metric,
                value,
                unit,
                category,
                source,
                "attribute_summary",
                desc,
                None,
            )
            if rec:
                yield rec

    # Detailed table (block-level)
    for record in data.get("detailed_table", []):
        state = clean_state_name(record.get("state", ""))
        district = clean_district_name(record.get("district"))
        block = clean_block_name(record.get("assessment_unit_name"))
        categorization = record.get("categorization")

        metrics = [
            (
                "geographical_area_total_ha",
                record.get("total_geographical_area_ha"),
                "ha",
                "geographical_area",
                "total geographical area",
            ),
            (
                "recharge_worthy_area_ha",
                record.get("recharge_worthy_area_ha"),
                "ha",
                "geographical_area",
                "recharge-worthy area",
            ),
            (
                "total_annual_recharge_ham",
                record.get("total_annual_recharge_ham"),
                "ham",
                "recharge",
                "total annual groundwater recharge",
            ),
            (
                "natural_discharge_ham",
                record.get("total_natural_discharges_ham"),
                "ham",
                "discharge",
                "total natural discharge",
            ),
            (
                "annual_extractable_resource_ham",
                record.get("annual_extractable_resource_ham"),
                "ham",
                "resources",
                "annual extractable groundwater resource",
            ),
            (
                "extraction_irrigation_ham",
                get_nested_value(record, "extraction_ham", "irrigation"),
                "ham",
                "extraction",
                "groundwater extraction for irrigation",
            ),
            (
                "extraction_domestic_ham",
                get_nested_value(record, "extraction_ham", "domestic"),
                "ham",
                "extraction",
                "groundwater extraction for domestic use",
            ),
            (
                "extraction_industrial_ham",
                get_nested_value(record, "extraction_ham", "industrial"),
                "ham",
                "extraction",
                "groundwater extraction for industrial use",
            ),
            (
                "extraction_total_ham",
                get_nested_value(record, "extraction_ham", "total"),
                "ham",
                "extraction",
                "total groundwater extraction",
            ),
            (
                "domestic_allocation_2025_ham",
                record.get("annual_gw_allocation_domestic_2025_ham"),
                "ham",
                "allocation",
                "domestic allocation projected for 2025",
            ),
            (
                "net_gw_availability_future_ham",
                record.get("net_gw_availability_future_ham"),
                "ham",
                "availability",
                "net groundwater availability for future use",
            ),
            (
                "stage_of_extraction_percent",
                record.get("stage_of_extraction_percent"),
                "percent",
                "status",
                "stage of groundwater extraction",
            ),
            (
                "categorization_status",
                categorization,
                "",
                "status",
                "groundwater status category",
            ),
        ]

        for metric, value, unit, category, desc in metrics:
            rec = create_record(
                state,
                district,
                block,
                year,
                metric,
                value,
                unit,
                category,
                source,
                "attribute_detailed",
                desc,
                categorization,
            )
            if rec:
                yield rec


def normalize_annexure1(filepath: Path) -> Generator[Dict, None, None]:
    """
    Normalize Annexure 1: State-wise groundwater resources (BCM).
    """
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    year = data.get("year", "")
    source = f"annexures/{filepath.name}"

    for record in data.get("records", []):
        state = clean_state_name(record.get("state", ""))

        metrics = [
            (
                "monsoon_recharge_from_rainfall_bcm",
                get_nested_value(
                    record,
                    "ground_water_recharge_bcm",
                    "monsoon_season",
                    "from_rainfall",
                ),
                "bcm",
                "recharge",
                "monsoon season rainfall recharge",
            ),
            (
                "monsoon_recharge_other_sources_bcm",
                get_nested_value(
                    record,
                    "ground_water_recharge_bcm",
                    "monsoon_season",
                    "from_other_sources",
                ),
                "bcm",
                "recharge",
                "monsoon season recharge from other sources",
            ),
            (
                "non_monsoon_recharge_from_rainfall_bcm",
                get_nested_value(
                    record,
                    "ground_water_recharge_bcm",
                    "non_monsoon_season",
                    "from_rainfall",
                ),
                "bcm",
                "recharge",
                "non-monsoon season rainfall recharge",
            ),
            (
                "non_monsoon_recharge_other_sources_bcm",
                get_nested_value(
                    record,
                    "ground_water_recharge_bcm",
                    "non_monsoon_season",
                    "from_other_sources",
                ),
                "bcm",
                "recharge",
                "non-monsoon season recharge from other sources",
            ),
            (
                "total_annual_recharge_bcm",
                get_nested_value(record, "ground_water_recharge_bcm", "total_annual"),
                "bcm",
                "recharge",
                "total annual groundwater recharge",
            ),
            (
                "natural_discharge_bcm",
                record.get("total_natural_discharges_bcm"),
                "bcm",
                "discharge",
                "total natural groundwater discharge",
            ),
            (
                "annual_extractable_resource_bcm",
                record.get("annual_extractable_resource_bcm"),
                "bcm",
                "resources",
                "annual extractable groundwater resource",
            ),
            (
                "extraction_irrigation_bcm",
                get_nested_value(record, "current_annual_extraction_bcm", "irrigation"),
                "bcm",
                "extraction",
                "groundwater extraction for irrigation",
            ),
            (
                "extraction_domestic_bcm",
                get_nested_value(record, "current_annual_extraction_bcm", "domestic"),
                "bcm",
                "extraction",
                "groundwater extraction for domestic use",
            ),
            (
                "extraction_industrial_bcm",
                get_nested_value(record, "current_annual_extraction_bcm", "industrial"),
                "bcm",
                "extraction",
                "groundwater extraction for industrial use",
            ),
            (
                "extraction_total_bcm",
                get_nested_value(record, "current_annual_extraction_bcm", "total"),
                "bcm",
                "extraction",
                "total groundwater extraction",
            ),
            (
                "domestic_allocation_bcm",
                record.get("annual_gw_allocation_domestic_bcm"),
                "bcm",
                "allocation",
                "domestic groundwater allocation",
            ),
            (
                "net_gw_availability_bcm",
                record.get("net_gw_availability_bcm"),
                "bcm",
                "availability",
                "net groundwater availability",
            ),
            (
                "stage_of_extraction_percent",
                record.get("stage_of_extraction_percent"),
                "percent",
                "status",
                "stage of groundwater extraction",
            ),
        ]

        for metric, value, unit, category, desc in metrics:
            rec = create_record(
                state,
                None,
                None,
                year,
                f"state_{metric}",
                value,
                unit,
                category,
                source,
                "annexure_1",
                desc,
                None,
            )
            if rec:
                yield rec


def normalize_annexure2(filepath: Path) -> Generator[Dict, None, None]:
    """
    Normalize Annexure 2: District-wise groundwater resources (HAM).
    """
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    year = data.get("year", "")
    source = f"annexures/{filepath.name}"

    for record in data.get("records", []):
        state = clean_state_name(record.get("state", ""))
        district = clean_district_name(record.get("district"))

        # Skip invalid districts
        if not district or (len(district) <= 2 and district.isdigit()):
            continue

        metrics = [
            (
                "monsoon_recharge_from_rainfall_ham",
                get_nested_value(
                    record,
                    "ground_water_recharge_ham",
                    "monsoon_season",
                    "from_rainfall",
                ),
                "ham",
                "recharge",
                "monsoon season rainfall recharge",
            ),
            (
                "monsoon_recharge_other_sources_ham",
                get_nested_value(
                    record,
                    "ground_water_recharge_ham",
                    "monsoon_season",
                    "from_other_sources",
                ),
                "ham",
                "recharge",
                "monsoon season recharge from other sources",
            ),
            (
                "non_monsoon_recharge_from_rainfall_ham",
                get_nested_value(
                    record,
                    "ground_water_recharge_ham",
                    "non_monsoon_season",
                    "from_rainfall",
                ),
                "ham",
                "recharge",
                "non-monsoon season rainfall recharge",
            ),
            (
                "non_monsoon_recharge_other_sources_ham",
                get_nested_value(
                    record,
                    "ground_water_recharge_ham",
                    "non_monsoon_season",
                    "from_other_sources",
                ),
                "ham",
                "recharge",
                "non-monsoon season recharge from other sources",
            ),
            (
                "total_annual_recharge_ham",
                get_nested_value(record, "ground_water_recharge_ham", "total_annual"),
                "ham",
                "recharge",
                "total annual groundwater recharge",
            ),
            (
                "natural_discharge_ham",
                record.get("total_natural_discharges_ham"),
                "ham",
                "discharge",
                "total natural groundwater discharge",
            ),
            (
                "annual_extractable_resource_ham",
                record.get("annual_extractable_resource_ham"),
                "ham",
                "resources",
                "annual extractable groundwater resource",
            ),
            (
                "extraction_irrigation_ham",
                get_nested_value(record, "current_annual_extraction_ham", "irrigation"),
                "ham",
                "extraction",
                "groundwater extraction for irrigation",
            ),
            (
                "extraction_domestic_ham",
                get_nested_value(record, "current_annual_extraction_ham", "domestic"),
                "ham",
                "extraction",
                "groundwater extraction for domestic use",
            ),
            (
                "extraction_industrial_ham",
                get_nested_value(record, "current_annual_extraction_ham", "industrial"),
                "ham",
                "extraction",
                "groundwater extraction for industrial use",
            ),
            (
                "extraction_total_ham",
                get_nested_value(record, "current_annual_extraction_ham", "total"),
                "ham",
                "extraction",
                "total groundwater extraction",
            ),
            (
                "domestic_allocation_ham",
                record.get("annual_gw_allocation_domestic_ham"),
                "ham",
                "allocation",
                "domestic groundwater allocation",
            ),
            (
                "net_gw_availability_ham",
                record.get("net_gw_availability_ham"),
                "ham",
                "availability",
                "net groundwater availability",
            ),
            (
                "stage_of_extraction_percent",
                record.get("stage_of_extraction_percent"),
                "percent",
                "status",
                "stage of groundwater extraction",
            ),
        ]

        for metric, value, unit, category, desc in metrics:
            rec = create_record(
                state,
                district,
                None,
                year,
                f"district_{metric}",
                value,
                unit,
                category,
                source,
                "annexure_2",
                desc,
                None,
            )
            if rec:
                yield rec


def normalize_annexure3(filepath: Path) -> Generator[Dict, None, None]:
    """
    Normalize Annexure 3: Categorization summary tables.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    year = data.get("year", "")
    source = f"annexures/{filepath.name}"

    # State categorization (3a)
    for record in data.get("annexure_3a_state_categorization", []):
        state = clean_state_name(record.get("state", ""))

        metrics = [
            (
                "total_assessed_units",
                record.get("total_assessed_units"),
                "count",
                "categorization",
                "total assessed units",
            ),
            (
                "safe_units_count",
                get_nested_value(record, "safe", "count"),
                "count",
                "categorization",
                "safe units",
            ),
            (
                "safe_units_percent",
                get_nested_value(record, "safe", "percent"),
                "percent",
                "categorization",
                "percentage of safe units",
            ),
            (
                "semi_critical_units_count",
                get_nested_value(record, "semi_critical", "count"),
                "count",
                "categorization",
                "semi-critical units",
            ),
            (
                "semi_critical_units_percent",
                get_nested_value(record, "semi_critical", "percent"),
                "percent",
                "categorization",
                "percentage of semi-critical units",
            ),
            (
                "critical_units_count",
                get_nested_value(record, "critical", "count"),
                "count",
                "categorization",
                "critical units",
            ),
            (
                "critical_units_percent",
                get_nested_value(record, "critical", "percent"),
                "percent",
                "categorization",
                "percentage of critical units",
            ),
            (
                "over_exploited_units_count",
                get_nested_value(record, "over_exploited", "count"),
                "count",
                "categorization",
                "over-exploited units",
            ),
            (
                "over_exploited_units_percent",
                get_nested_value(record, "over_exploited", "percent"),
                "percent",
                "categorization",
                "percentage of over-exploited units",
            ),
            (
                "saline_units_count",
                get_nested_value(record, "saline", "count"),
                "count",
                "categorization",
                "saline units",
            ),
            (
                "saline_units_percent",
                get_nested_value(record, "saline", "percent"),
                "percent",
                "categorization",
                "percentage of saline units",
            ),
        ]

        for metric, value, unit, category, desc in metrics:
            rec = create_record(
                state,
                None,
                None,
                year,
                f"state_categorization_{metric}",
                value,
                unit,
                category,
                source,
                "annexure_3a",
                desc,
                None,
            )
            if rec:
                yield rec

    # District categorization (3b)
    for record in data.get("annexure_3b_district_categorization", []):
        state = clean_state_name(record.get("state", ""))
        district = clean_district_name(record.get("district"))

        metrics = [
            (
                "total_assessed_units",
                record.get("total_assessed_units"),
                "count",
                "categorization",
                "total assessed units",
            ),
            (
                "safe_units_count",
                get_nested_value(record, "safe", "count"),
                "count",
                "categorization",
                "safe units",
            ),
            (
                "safe_units_percent",
                get_nested_value(record, "safe", "percent"),
                "percent",
                "categorization",
                "percentage of safe units",
            ),
            (
                "over_exploited_units_count",
                get_nested_value(record, "over_exploited", "count"),
                "count",
                "categorization",
                "over-exploited units",
            ),
            (
                "over_exploited_units_percent",
                get_nested_value(record, "over_exploited", "percent"),
                "percent",
                "categorization",
                "percentage of over-exploited units",
            ),
            (
                "critical_units_count",
                get_nested_value(record, "critical", "count"),
                "count",
                "categorization",
                "critical units",
            ),
            (
                "saline_units_count",
                get_nested_value(record, "saline", "count"),
                "count",
                "categorization",
                "saline units",
            ),
        ]

        for metric, value, unit, category, desc in metrics:
            rec = create_record(
                state,
                district,
                None,
                year,
                f"district_categorization_{metric}",
                value,
                unit,
                category,
                source,
                "annexure_3b",
                desc,
                None,
            )
            if rec:
                yield rec

    # State extractable resources (3c)
    for record in data.get("annexure_3c_state_extractable_resource", []):
        state = clean_state_name(record.get("state", ""))

        metrics = [
            (
                "total_extractable_resource_ham",
                record.get("total_extractable_resource_ham"),
                "ham",
                "resources",
                "total extractable groundwater resource",
            ),
            (
                "safe_resource_ham",
                get_nested_value(record, "safe", "resource_ham"),
                "ham",
                "resources",
                "extractable resource in safe units",
            ),
            (
                "over_exploited_resource_ham",
                get_nested_value(record, "over_exploited", "resource_ham"),
                "ham",
                "resources",
                "extractable resource in over-exploited units",
            ),
        ]

        for metric, value, unit, category, desc in metrics:
            rec = create_record(
                state,
                None,
                None,
                year,
                f"state_resource_{metric}",
                value,
                unit,
                category,
                source,
                "annexure_3c",
                desc,
                None,
            )
            if rec:
                yield rec

    # State area categorization (3e)
    for record in data.get("annexure_3e_state_area_categorization", []):
        state = clean_state_name(record.get("state", ""))

        metrics = [
            (
                "total_geographical_area_sq_km",
                record.get("total_geographical_area_sq_km"),
                "sq_km",
                "area",
                "total geographical area",
            ),
            (
                "recharge_worthy_area_sq_km",
                record.get("recharge_worthy_area_sq_km"),
                "sq_km",
                "area",
                "recharge-worthy area",
            ),
            (
                "safe_area_sq_km",
                get_nested_value(record, "safe", "area_sq_km"),
                "sq_km",
                "area",
                "area under safe category",
            ),
            (
                "over_exploited_area_sq_km",
                get_nested_value(record, "over_exploited", "area_sq_km"),
                "sq_km",
                "area",
                "area under over-exploited category",
            ),
        ]

        for metric, value, unit, category, desc in metrics:
            rec = create_record(
                state,
                None,
                None,
                year,
                f"state_area_{metric}",
                value,
                unit,
                category,
                source,
                "annexure_3e",
                desc,
                None,
            )
            if rec:
                yield rec


def normalize_annexure4(filepath: Path) -> Generator[Dict, None, None]:
    """
    Normalize Annexure 4: Categorized units and quality problems.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    year = data.get("year", "")
    source = f"annexures/{filepath.name}"

    # Categorized units (4a)
    for record in data.get("annexure_4a_categorized_units", []):
        state = clean_state_name(record.get("state", ""))
        district = clean_district_name(record.get("district"))

        for unit_type, status in [
            ("semi_critical_unit", "semi-critical"),
            ("critical_unit", "critical"),
            ("over_exploited_unit", "over-exploited"),
        ]:
            unit_name = record.get(unit_type, "")
            if unit_name and unit_name.strip():
                block = clean_block_name(unit_name)
                yield {
                    "id": generate_id(
                        state, district or "", block or "", year, "unit_status"
                    ),
                    "state": state,
                    "district": district,
                    "block": block,
                    "year": year,
                    "metric": "groundwater_unit_status",
                    "value": status,
                    "unit": "",
                    "category": "categorization",
                    "categorization": status,
                    "source": source,
                    "source_type": "annexure_4a",
                    "text": f"{block} in {district} district, {state} is categorized as {status} ({year}).",
                }

    # Quality problems (4b)
    for record in data.get("annexure_4b_quality_problems", []):
        state = clean_state_name(record.get("state", ""))
        district = clean_district_name(record.get("district"))

        for problem_type, problem_name in [
            ("fluoride_affected_unit", "fluoride"),
            ("arsenic_affected_unit", "arsenic"),
            ("salinity_affected_unit", "salinity"),
        ]:
            unit_name = record.get(problem_type, "")
            if unit_name and unit_name.strip():
                block = clean_block_name(unit_name)
                yield {
                    "id": generate_id(
                        state,
                        district or "",
                        block or "",
                        year,
                        f"{problem_name}_affected",
                    ),
                    "state": state,
                    "district": district,
                    "block": block,
                    "year": year,
                    "metric": "water_quality_issue",
                    "value": problem_name,
                    "unit": "",
                    "category": "water_quality",
                    "categorization": None,
                    "source": source,
                    "source_type": "annexure_4b",
                    "text": f"{block} in {district} district, {state} is affected by {problem_name} contamination ({year}).",
                }


# ============================================================================
# MAIN PROCESSING
# ============================================================================


def process_all_reports() -> Tuple[int, Dict[str, int]]:
    """Process all reports and generate unified dataset."""
    total_records = 0
    counts = {}

    with open(OUTPUT_FILE, "w", encoding="utf-8") as outfile:
        # 1. State Reports
        state_reports_dir = BASE_DIR / "state_reports"
        if state_reports_dir.exists():
            print(f"\n📂 Processing state reports...")
            for filepath in sorted(state_reports_dir.glob("*.json")):
                print(f"  📄 {filepath.name}")
                for record in normalize_state_report(filepath):
                    outfile.write(json.dumps(record, ensure_ascii=False) + "\n")
                    total_records += 1
                    counts["state_report"] = counts.get("state_report", 0) + 1

        # 2. Central Reports
        central_reports_dir = BASE_DIR / "central_reports"
        if central_reports_dir.exists():
            print(f"\n📂 Processing central reports...")
            for filepath in sorted(central_reports_dir.glob("*.json")):
                print(f"  📄 {filepath.name}")
                for record in normalize_central_report(filepath):
                    outfile.write(json.dumps(record, ensure_ascii=False) + "\n")
                    total_records += 1
                    counts["central_report"] = counts.get("central_report", 0) + 1

        # 3. Attribute Reports
        attribute_reports_dir = BASE_DIR / "attribute_reports"
        if attribute_reports_dir.exists():
            print(f"\n📂 Processing attribute reports...")
            for filepath in sorted(attribute_reports_dir.glob("*.json")):
                print(f"  📄 {filepath.name}")
                for record in normalize_attribute_report(filepath):
                    outfile.write(json.dumps(record, ensure_ascii=False) + "\n")
                    total_records += 1
                    st = record.get("source_type", "attribute")
                    counts[st] = counts.get(st, 0) + 1

        # 4. Annexures
        annexures_dir = BASE_DIR / "annexures"
        if annexures_dir.exists():
            print(f"\n📂 Processing annexures...")

            for ann_num, normalizer in [
                ("1", normalize_annexure1),
                ("2", normalize_annexure2),
                ("3", normalize_annexure3),
                ("4", normalize_annexure4),
            ]:
                for filepath in sorted(annexures_dir.glob(f"annexure{ann_num}_*.json")):
                    print(f"  📄 {filepath.name}")
                    for record in normalizer(filepath):
                        outfile.write(json.dumps(record, ensure_ascii=False) + "\n")
                        total_records += 1
                        counts[f"annexure_{ann_num}"] = (
                            counts.get(f"annexure_{ann_num}", 0) + 1
                        )

    return total_records, counts


def main():
    """Main entry point."""
    print("=" * 70)
    print("🚀 OPTIMIZED UNIFIED DATASET GENERATOR FOR GROUNDWATER RAG")
    print("=" * 70)
    print(f"\n📁 Base directory: {BASE_DIR}")
    print(f"📤 Output file: {OUTPUT_FILE}")

    start_time = datetime.now()
    total, counts = process_all_reports()
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    print("\n" + "=" * 70)
    print("✅ PROCESSING COMPLETE!")
    print("=" * 70)
    print(f"\n📊 STATISTICS:")
    print(f"  Total records generated: {total:,}")
    print(f"\n  By source type:")
    for source_type, count in sorted(counts.items()):
        print(f"    • {source_type}: {count:,}")

    print(f"\n⏱️  Processing time: {duration:.2f} seconds")

    if OUTPUT_FILE.exists():
        size_mb = OUTPUT_FILE.stat().st_size / (1024 * 1024)
        print(f"💾 File size: {size_mb:.2f} MB")

    # Show samples
    print("\n" + "=" * 70)
    print("🎯 SAMPLE RECORDS:")
    print("=" * 70)

    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i >= 5:
                break
            record = json.loads(line)
            print(f"\n📝 Record {i + 1}:")
            print(f"   State: {record['state']}")
            print(f"   District: {record['district']}")
            print(f"   Block: {record['block']}")
            print(f"   Year: {record['year']}")
            print(f"   Metric: {record['metric']}")
            print(f"   Value: {record['value']} {record['unit']}")
            print(f"   Text: {record['text']}")


if __name__ == "__main__":
    main()
