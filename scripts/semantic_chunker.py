"""
Semantic Chunker for Groundwater RAG System
============================================

Creates location-based semantic chunks that group all metrics for a single
location (state/district/block + year) into rich, context-dense text chunks.

This produces ~20,000-50,000 chunks instead of millions of atomic records,
with each chunk containing comprehensive information about a location.

Output Schema:
{
    "id": "deterministic_hash",
    "state": "state_name",
    "district": "district_name or null",
    "block": "block/assessment_unit or null",
    "year": "YYYY-YYYY",
    "source_type": "state_report/central_report/etc",
    "source": "path/to/source.json",
    "categorization": "safe/critical/etc",
    "text": "Rich natural language description with all metrics",
    "metadata": {
        "key_metric_1": value,
        "key_metric_2": value,
        ...
    }
}
"""

import json
import hashlib
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional
from datetime import datetime
from collections import defaultdict


# ============================================================================
# CONFIGURATION
# ============================================================================

BASE_DIR = Path(__file__).parent.parent / "output"
OUTPUT_FILE = BASE_DIR / "semantic_chunks.jsonl"

# Unit descriptions
UNIT_NAMES = {
    "ham": "hectare meters",
    "bcm": "billion cubic meters",
    "mm": "millimeters",
    "ha": "hectares",
    "sq_km": "square kilometers",
    "percent": "%",
}


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================


def generate_id(*parts) -> str:
    """Generate deterministic ID from parts.

    Uses '_NULL_' placeholder for None/empty values to preserve position
    and avoid collisions between different record types.
    """
    # Convert each part to string, using placeholder for None/empty to preserve position
    normalized_parts = []
    for p in parts:
        if p is None or p == "":
            normalized_parts.append("_NULL_")
        else:
            normalized_parts.append(str(p))
    content = "|".join(normalized_parts)
    return hashlib.md5(content.encode()).hexdigest()[:16]


def clean_name(name: str, name_type: str = "general") -> Optional[str]:
    """Clean and normalize names."""
    if not name:
        return None
    name = str(name).strip()
    if not name or name.lower() in ("null", "none", ""):
        return None

    # Title case if all caps
    if name.isupper():
        name = name.title()

    # State name fixes
    if name_type == "state":
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
            if name.lower() == old.lower():
                return new

    return name


def format_value(value: Any, unit: str = "") -> str:
    """Format numeric value for display."""
    if value is None:
        return "N/A"
    if isinstance(value, float):
        if abs(value) >= 1000000:
            return f"{value / 1000000:.2f}M"
        elif abs(value) >= 1000:
            return f"{value / 1000:.2f}K"
        elif value == int(value):
            return str(int(value))
        else:
            return f"{value:.2f}"
    return str(value)


def get_nested(obj: dict, *keys, default=None):
    """Safely get nested dictionary value."""
    for key in keys:
        if isinstance(obj, dict) and key in obj:
            obj = obj[key]
        else:
            return default
    return obj if obj is not None else default


def build_location_string(
    state: str, district: Optional[str], block: Optional[str]
) -> str:
    """Build human-readable location string."""
    if block and district:
        return f"{block} block in {district} district, {state}"
    elif district:
        return f"{district} district, {state}"
    else:
        return state


# ============================================================================
# CHUNK BUILDERS
# ============================================================================


def build_state_report_chunk(
    record: dict, state: str, year: str, source: str, row_index: int = 0
) -> Optional[Dict]:
    """Build a semantic chunk from a state report record (block-level)."""

    district = clean_name(record.get("district"), "district")
    block = clean_name(record.get("assessment_unit"), "block")
    watershed = record.get("watershed_district", "")
    serial_no = record.get("serial_no", row_index)

    if not block:
        return None

    # Get categorization
    cat_obj = record.get("categorization", {})
    categorization = None
    if isinstance(cat_obj, dict):
        categorization = cat_obj.get("overall") or cat_obj.get("non_contaminated")
    elif isinstance(cat_obj, str):
        categorization = cat_obj

    # Extract key metrics
    rainfall_total = get_nested(record, "rainfall_mm", "total")
    geo_area_total = get_nested(record, "geographical_area_ha", "total")
    recharge_worthy = get_nested(
        record, "geographical_area_ha", "recharge_worthy", "total"
    )

    gw_recharge_rainfall = get_nested(
        record, "ground_water_recharge_ham", "rainfall_recharge", "total"
    )
    gw_recharge_total = get_nested(
        record, "ground_water_recharge_ham", "subtotal", "total"
    )

    annual_recharge = get_nested(record, "annual_gw_recharge_ham", "total")
    extractable = get_nested(record, "annual_extractable_gw_resource_ham", "total")
    env_flows = get_nested(record, "environmental_flows_ham", "total")

    extraction_irrigation = get_nested(
        record, "gw_extraction_ham", "irrigation", "total"
    )
    extraction_domestic = get_nested(record, "gw_extraction_ham", "domestic", "total")
    extraction_industrial = get_nested(
        record, "gw_extraction_ham", "industrial", "total"
    )
    extraction_total = get_nested(record, "gw_extraction_ham", "total", "total")

    stage_of_extraction = get_nested(record, "stage_of_extraction_percent", "total")
    net_availability = get_nested(record, "net_annual_gw_availability_ham", "total")

    trend_pre = get_nested(record, "gw_trends", "pre_monsoon", "non_contaminated")
    trend_post = get_nested(record, "gw_trends", "post_monsoon", "non_contaminated")

    storage_fresh = get_nested(record, "in_storage_unconfined_gw_ham", "fresh")
    total_availability = get_nested(record, "total_gw_availability_ham", "fresh")

    # Build rich text description
    location = build_location_string(state, district, block)

    text_parts = [f"**{location} ({year})**"]

    # Add watershed info if available
    if watershed:
        text_parts.append(f"Watershed: {watershed}.")

    # Rainfall & Area
    area_info = []
    if rainfall_total:
        area_info.append(f"Annual rainfall: {format_value(rainfall_total)} mm")
    if geo_area_total:
        area_info.append(f"Total area: {format_value(geo_area_total)} ha")
    if recharge_worthy:
        area_info.append(f"Recharge-worthy area: {format_value(recharge_worthy)} ha")
    if area_info:
        text_parts.append(" | ".join(area_info) + ".")

    # Groundwater Recharge
    recharge_info = []
    if annual_recharge:
        recharge_info.append(
            f"Annual groundwater recharge: {format_value(annual_recharge)} ham"
        )
    if gw_recharge_rainfall:
        recharge_info.append(f"from rainfall: {format_value(gw_recharge_rainfall)} ham")
    if recharge_info:
        text_parts.append(" | ".join(recharge_info) + ".")

    # Resources & Extraction
    resource_info = []
    if extractable:
        resource_info.append(f"Extractable resource: {format_value(extractable)} ham")
    if extraction_total:
        ext_details = f"Total extraction: {format_value(extraction_total)} ham"
        ext_breakdown = []
        if extraction_irrigation:
            ext_breakdown.append(f"irrigation {format_value(extraction_irrigation)}")
        if extraction_domestic:
            ext_breakdown.append(f"domestic {format_value(extraction_domestic)}")
        if extraction_industrial and extraction_industrial > 0:
            ext_breakdown.append(f"industrial {format_value(extraction_industrial)}")
        if ext_breakdown:
            ext_details += f" ({', '.join(ext_breakdown)})"
        resource_info.append(ext_details)
    if resource_info:
        text_parts.append(" | ".join(resource_info) + ".")

    # Status
    status_info = []
    if stage_of_extraction is not None:
        status_info.append(f"Stage of extraction: {format_value(stage_of_extraction)}%")
    if net_availability:
        status_info.append(f"Net availability: {format_value(net_availability)} ham")
    if categorization:
        status_info.append(f"Status: **{categorization.upper()}**")
    if status_info:
        text_parts.append(" | ".join(status_info) + ".")

    # Trends
    if trend_pre or trend_post:
        trend_info = "Groundwater trend:"
        if trend_pre:
            trend_info += f" Pre-monsoon: {trend_pre}"
        if trend_post:
            trend_info += f" | Post-monsoon: {trend_post}"
        text_parts.append(trend_info + ".")

    # Storage
    if storage_fresh and storage_fresh > 0:
        text_parts.append(
            f"Fresh groundwater in storage: {format_value(storage_fresh)} ham."
        )

    # Build metadata for filtering
    metadata = {}
    if rainfall_total:
        metadata["rainfall_mm"] = rainfall_total
    if annual_recharge:
        metadata["annual_recharge_ham"] = annual_recharge
    if extractable:
        metadata["extractable_resource_ham"] = extractable
    if extraction_total:
        metadata["extraction_total_ham"] = extraction_total
    if stage_of_extraction is not None:
        metadata["stage_of_extraction_percent"] = stage_of_extraction
    if net_availability:
        metadata["net_availability_ham"] = net_availability
    if categorization:
        metadata["categorization"] = categorization

    return {
        "id": generate_id(state, district, block, year, "state_report", serial_no),
        "state": state,
        "district": district,
        "block": block,
        "year": year,
        "source_type": "state_report",
        "source": source,
        "categorization": categorization,
        "text": " ".join(text_parts),
        "metadata": metadata,
        "watershed": watershed if watershed else None,
    }


def build_central_report_chunk(
    record: dict, year: str, source: str, row_index: int = 0
) -> Optional[Dict]:
    """Build a semantic chunk from a central report record (district-level)."""

    state = clean_name(record.get("state"), "state")
    district = clean_name(record.get("district"), "district")

    if not state or not district:
        return None

    categorization = record.get("categorization")

    # Extract metrics
    rainfall_total = get_nested(record, "rainfall_mm", "total")
    geo_area_total = get_nested(record, "total_geographical_area_ha", "total")
    recharge_worthy = get_nested(
        record, "total_geographical_area_ha", "recharge_worthy_area", "total"
    )

    gw_recharge_rainfall = get_nested(
        record, "ground_water_recharge_ham", "rainfall_recharge", "total"
    )
    total_annual_recharge = record.get("total_annual_recharge_ham")
    natural_discharge = record.get("natural_discharge_ham")
    extractable = record.get("annual_extractable_resource_ham")

    extraction_irrigation = get_nested(record, "current_extraction_ham", "irrigation")
    extraction_domestic = get_nested(record, "current_extraction_ham", "domestic")
    extraction_industrial = get_nested(record, "current_extraction_ham", "industrial")
    extraction_total = get_nested(record, "current_extraction_ham", "total")

    stage_of_extraction = record.get("stage_of_extraction_percent")

    # Build text
    location = build_location_string(state, district, None)
    text_parts = [f"**{location} ({year}) - District Summary**"]

    # Area & Rainfall
    if rainfall_total:
        text_parts.append(f"Annual rainfall: {format_value(rainfall_total)} mm.")
    if geo_area_total:
        text_parts.append(
            f"Total geographical area: {format_value(geo_area_total)} ha (recharge-worthy: {format_value(recharge_worthy)} ha)."
        )

    # Recharge
    if total_annual_recharge and total_annual_recharge > 0:
        text_parts.append(
            f"Total annual groundwater recharge: {format_value(total_annual_recharge)} ham."
        )
    elif gw_recharge_rainfall:
        text_parts.append(
            f"Groundwater recharge from rainfall: {format_value(gw_recharge_rainfall)} ham."
        )

    # Resources
    if natural_discharge and natural_discharge > 0:
        text_parts.append(f"Natural discharge: {format_value(natural_discharge)} ham.")
    if extractable and extractable > 0:
        text_parts.append(
            f"Annual extractable resource: {format_value(extractable)} ham."
        )

    # Extraction
    if extraction_total and extraction_total > 0:
        ext_text = f"Current extraction: {format_value(extraction_total)} ham"
        ext_parts = []
        if extraction_irrigation:
            ext_parts.append(f"irrigation {format_value(extraction_irrigation)}")
        if extraction_domestic:
            ext_parts.append(f"domestic {format_value(extraction_domestic)}")
        if extraction_industrial and extraction_industrial > 0:
            ext_parts.append(f"industrial {format_value(extraction_industrial)}")
        if ext_parts:
            ext_text += f" ({', '.join(ext_parts)})"
        text_parts.append(ext_text + ".")

    # Status
    if stage_of_extraction and stage_of_extraction > 0:
        text_parts.append(f"Stage of extraction: {format_value(stage_of_extraction)}%.")
    if categorization:
        text_parts.append(f"Groundwater status: **{categorization.upper()}**.")

    # Metadata
    metadata = {}
    if rainfall_total:
        metadata["rainfall_mm"] = rainfall_total
    if total_annual_recharge:
        metadata["annual_recharge_ham"] = total_annual_recharge
    if extractable:
        metadata["extractable_resource_ham"] = extractable
    if extraction_total:
        metadata["extraction_total_ham"] = extraction_total
    if stage_of_extraction:
        metadata["stage_of_extraction_percent"] = stage_of_extraction
    if categorization:
        metadata["categorization"] = categorization

    return {
        "id": generate_id(state, district, None, year, "central_report", row_index),
        "state": state,
        "district": district,
        "block": None,
        "year": year,
        "source_type": "central_report",
        "source": source,
        "categorization": categorization,
        "text": " ".join(text_parts),
        "metadata": metadata,
    }


def build_attribute_summary_chunk(
    record: dict, year: str, source: str
) -> Optional[Dict]:
    """Build a semantic chunk from attribute report summary (state-level counts)."""

    state = clean_name(record.get("state"), "state")
    if not state:
        return None

    over_exploited = record.get("over_exploited_count", 0)
    safe = record.get("safe_count", 0)
    critical = record.get("critical_count", 0)
    semi_critical = record.get("semi_critical_count", 0)
    saline = record.get("saline_count", 0)
    total = record.get("total_count", 0)

    # Build text
    text_parts = [f"**{state} ({year}) - Groundwater Unit Categorization Summary**"]
    text_parts.append(f"Total assessed units: {int(total)}.")

    categories = []
    if safe:
        pct = (safe / total * 100) if total else 0
        categories.append(f"Safe: {int(safe)} ({pct:.1f}%)")
    if semi_critical:
        pct = (semi_critical / total * 100) if total else 0
        categories.append(f"Semi-critical: {int(semi_critical)} ({pct:.1f}%)")
    if critical:
        pct = (critical / total * 100) if total else 0
        categories.append(f"Critical: {int(critical)} ({pct:.1f}%)")
    if over_exploited:
        pct = (over_exploited / total * 100) if total else 0
        categories.append(f"Over-exploited: {int(over_exploited)} ({pct:.1f}%)")
    if saline:
        pct = (saline / total * 100) if total else 0
        categories.append(f"Saline: {int(saline)} ({pct:.1f}%)")

    text_parts.append(" | ".join(categories) + ".")

    # Determine overall status
    overall_status = "safe"
    if over_exploited > 0 or critical > 0:
        if over_exploited > critical:
            overall_status = "has over-exploited areas"
        else:
            overall_status = "has critical areas"
    elif semi_critical > 0:
        overall_status = "has semi-critical areas"

    text_parts.append(f"Overall assessment: {state} {overall_status}.")

    return {
        "id": generate_id(state, None, None, year, "attribute_summary"),
        "state": state,
        "district": None,
        "block": None,
        "year": year,
        "source_type": "attribute_summary",
        "source": source,
        "categorization": overall_status,
        "text": " ".join(text_parts),
        "metadata": {
            "total_units": int(total),
            "safe_count": int(safe),
            "semi_critical_count": int(semi_critical),
            "critical_count": int(critical),
            "over_exploited_count": int(over_exploited),
            "saline_count": int(saline),
        },
    }


def build_attribute_detailed_chunk(
    record: dict, year: str, source: str, row_index: int = 0
) -> Optional[Dict]:
    """Build a semantic chunk from attribute report detailed table (block-level)."""

    state = clean_name(record.get("state"), "state")
    district = clean_name(record.get("district"), "district")
    block = clean_name(record.get("assessment_unit_name"), "block")

    if not state or not block:
        return None

    categorization = record.get("categorization")

    # Extract metrics
    geo_area = record.get("total_geographical_area_ha")
    recharge_worthy = record.get("recharge_worthy_area_ha")
    annual_recharge = record.get("total_annual_recharge_ham")
    natural_discharge = record.get("total_natural_discharges_ham")
    extractable = record.get("annual_extractable_resource_ham")

    extraction_irrigation = get_nested(record, "extraction_ham", "irrigation")
    extraction_domestic = get_nested(record, "extraction_ham", "domestic")
    extraction_industrial = get_nested(record, "extraction_ham", "industrial")
    extraction_total = get_nested(record, "extraction_ham", "total")

    stage_of_extraction = record.get("stage_of_extraction_percent")
    net_availability = record.get("net_gw_availability_future_ham")
    domestic_allocation = record.get("annual_gw_allocation_domestic_2025_ham")

    # Build text
    location = build_location_string(state, district, block)
    text_parts = [f"**{location} ({year}) - Detailed Assessment**"]

    if geo_area:
        text_parts.append(
            f"Geographical area: {format_value(geo_area)} ha (recharge-worthy: {format_value(recharge_worthy)} ha)."
        )

    if annual_recharge:
        text_parts.append(
            f"Total annual recharge: {format_value(annual_recharge)} ham."
        )

    if natural_discharge:
        text_parts.append(f"Natural discharge: {format_value(natural_discharge)} ham.")

    if extractable:
        text_parts.append(
            f"Annual extractable resource: {format_value(extractable)} ham."
        )

    if extraction_total:
        ext_text = f"Current extraction: {format_value(extraction_total)} ham"
        ext_parts = []
        if extraction_irrigation:
            ext_parts.append(f"irrigation {format_value(extraction_irrigation)}")
        if extraction_domestic:
            ext_parts.append(f"domestic {format_value(extraction_domestic)}")
        if extraction_industrial and extraction_industrial > 0:
            ext_parts.append(f"industrial {format_value(extraction_industrial)}")
        if ext_parts:
            ext_text += f" ({', '.join(ext_parts)})"
        text_parts.append(ext_text + ".")

    if stage_of_extraction:
        text_parts.append(f"Stage of extraction: {format_value(stage_of_extraction)}%.")

    if net_availability:
        text_parts.append(
            f"Net groundwater availability for future: {format_value(net_availability)} ham."
        )

    if domestic_allocation:
        text_parts.append(
            f"Projected domestic allocation (2025): {format_value(domestic_allocation)} ham."
        )

    if categorization:
        text_parts.append(f"Groundwater status: **{categorization.upper()}**.")

    # Metadata
    metadata = {}
    if annual_recharge:
        metadata["annual_recharge_ham"] = annual_recharge
    if extractable:
        metadata["extractable_resource_ham"] = extractable
    if extraction_total:
        metadata["extraction_total_ham"] = extraction_total
    if stage_of_extraction:
        metadata["stage_of_extraction_percent"] = stage_of_extraction
    if categorization:
        metadata["categorization"] = categorization

    return {
        "id": generate_id(
            state, district, block, year, "attribute_detailed", row_index
        ),
        "state": state,
        "district": district,
        "block": block,
        "year": year,
        "source_type": "attribute_detailed",
        "source": source,
        "categorization": categorization,
        "text": " ".join(text_parts),
        "metadata": metadata,
    }


def build_annexure1_chunk(record: dict, year: str, source: str) -> Optional[Dict]:
    """Build a semantic chunk from Annexure 1 (state-level BCM)."""

    state = clean_name(record.get("state"), "state")
    if not state:
        return None

    # Extract metrics (in BCM)
    monsoon_rainfall = get_nested(
        record, "ground_water_recharge_bcm", "monsoon_season", "from_rainfall"
    )
    monsoon_other = get_nested(
        record, "ground_water_recharge_bcm", "monsoon_season", "from_other_sources"
    )
    non_monsoon_rainfall = get_nested(
        record, "ground_water_recharge_bcm", "non_monsoon_season", "from_rainfall"
    )
    non_monsoon_other = get_nested(
        record, "ground_water_recharge_bcm", "non_monsoon_season", "from_other_sources"
    )
    total_annual = get_nested(record, "ground_water_recharge_bcm", "total_annual")

    natural_discharge = record.get("total_natural_discharges_bcm")
    extractable = record.get("annual_extractable_resource_bcm")

    extraction_irrigation = get_nested(
        record, "current_annual_extraction_bcm", "irrigation"
    )
    extraction_domestic = get_nested(
        record, "current_annual_extraction_bcm", "domestic"
    )
    extraction_industrial = get_nested(
        record, "current_annual_extraction_bcm", "industrial"
    )
    extraction_total = get_nested(record, "current_annual_extraction_bcm", "total")

    domestic_allocation = record.get("annual_gw_allocation_domestic_bcm")
    net_availability = record.get("net_gw_availability_bcm")
    stage_of_extraction = record.get("stage_of_extraction_percent")

    # Build text
    text_parts = [f"**{state} ({year}) - State Groundwater Resources (BCM)**"]

    if total_annual:
        text_parts.append(
            f"Total annual groundwater recharge: {format_value(total_annual)} BCM."
        )
        recharge_details = []
        if monsoon_rainfall:
            recharge_details.append(
                f"monsoon rainfall {format_value(monsoon_rainfall)} BCM"
            )
        if monsoon_other:
            recharge_details.append(
                f"monsoon other sources {format_value(monsoon_other)} BCM"
            )
        if non_monsoon_rainfall:
            recharge_details.append(
                f"non-monsoon rainfall {format_value(non_monsoon_rainfall)} BCM"
            )
        if non_monsoon_other:
            recharge_details.append(
                f"non-monsoon other {format_value(non_monsoon_other)} BCM"
            )
        if recharge_details:
            text_parts.append(f"Recharge breakdown: {', '.join(recharge_details)}.")

    if natural_discharge:
        text_parts.append(f"Natural discharge: {format_value(natural_discharge)} BCM.")

    if extractable:
        text_parts.append(
            f"Annual extractable resource: {format_value(extractable)} BCM."
        )

    if extraction_total:
        ext_text = f"Current annual extraction: {format_value(extraction_total)} BCM"
        ext_parts = []
        if extraction_irrigation:
            ext_parts.append(f"irrigation {format_value(extraction_irrigation)}")
        if extraction_domestic:
            ext_parts.append(f"domestic {format_value(extraction_domestic)}")
        if extraction_industrial and extraction_industrial > 0:
            ext_parts.append(f"industrial {format_value(extraction_industrial)}")
        if ext_parts:
            ext_text += f" ({', '.join(ext_parts)})"
        text_parts.append(ext_text + ".")

    if stage_of_extraction:
        text_parts.append(
            f"Stage of groundwater extraction: {format_value(stage_of_extraction)}%."
        )

    if net_availability:
        text_parts.append(
            f"Net groundwater availability: {format_value(net_availability)} BCM."
        )

    return {
        "id": generate_id(state, None, None, year, "annexure1"),
        "state": state,
        "district": None,
        "block": None,
        "year": year,
        "source_type": "annexure_1",
        "source": source,
        "categorization": None,
        "text": " ".join(text_parts),
        "metadata": {
            "total_annual_recharge_bcm": total_annual,
            "extractable_resource_bcm": extractable,
            "extraction_total_bcm": extraction_total,
            "net_availability_bcm": net_availability,
            "stage_of_extraction_percent": stage_of_extraction,
        },
    }


def build_annexure2_chunk(record: dict, year: str, source: str) -> Optional[Dict]:
    """Build a semantic chunk from Annexure 2 (district-level HAM)."""

    state = clean_name(record.get("state"), "state")
    district = clean_name(record.get("district"), "district")

    # Skip invalid districts
    if not district or (len(district) <= 2 and district.isdigit()):
        return None

    # Extract metrics (in HAM)
    monsoon_rainfall = get_nested(
        record, "ground_water_recharge_ham", "monsoon_season", "from_rainfall"
    )
    monsoon_other = get_nested(
        record, "ground_water_recharge_ham", "monsoon_season", "from_other_sources"
    )
    non_monsoon_rainfall = get_nested(
        record, "ground_water_recharge_ham", "non_monsoon_season", "from_rainfall"
    )
    non_monsoon_other = get_nested(
        record, "ground_water_recharge_ham", "non_monsoon_season", "from_other_sources"
    )
    total_annual = get_nested(record, "ground_water_recharge_ham", "total_annual")

    natural_discharge = record.get("total_natural_discharges_ham")
    extractable = record.get("annual_extractable_resource_ham")

    extraction_irrigation = get_nested(
        record, "current_annual_extraction_ham", "irrigation"
    )
    extraction_domestic = get_nested(
        record, "current_annual_extraction_ham", "domestic"
    )
    extraction_industrial = get_nested(
        record, "current_annual_extraction_ham", "industrial"
    )
    extraction_total = get_nested(record, "current_annual_extraction_ham", "total")

    domestic_allocation = record.get("annual_gw_allocation_domestic_ham")
    net_availability = record.get("net_gw_availability_ham")
    stage_of_extraction = record.get("stage_of_extraction_percent")

    # Build text
    location = build_location_string(state, district, None)
    text_parts = [f"**{location} ({year}) - District Groundwater Resources**"]

    if total_annual:
        text_parts.append(
            f"Total annual groundwater recharge: {format_value(total_annual)} ham."
        )

    if natural_discharge:
        text_parts.append(f"Natural discharge: {format_value(natural_discharge)} ham.")

    if extractable:
        text_parts.append(
            f"Annual extractable resource: {format_value(extractable)} ham."
        )

    if extraction_total:
        ext_text = f"Current extraction: {format_value(extraction_total)} ham"
        ext_parts = []
        if extraction_irrigation:
            ext_parts.append(f"irrigation {format_value(extraction_irrigation)}")
        if extraction_domestic:
            ext_parts.append(f"domestic {format_value(extraction_domestic)}")
        if extraction_industrial and extraction_industrial > 0:
            ext_parts.append(f"industrial {format_value(extraction_industrial)}")
        if ext_parts:
            ext_text += f" ({', '.join(ext_parts)})"
        text_parts.append(ext_text + ".")

    if stage_of_extraction:
        text_parts.append(f"Stage of extraction: {format_value(stage_of_extraction)}%.")

    if net_availability:
        text_parts.append(
            f"Net groundwater availability: {format_value(net_availability)} ham."
        )

    return {
        "id": generate_id(state, district, None, year, "annexure2"),
        "state": state,
        "district": district,
        "block": None,
        "year": year,
        "source_type": "annexure_2",
        "source": source,
        "categorization": None,
        "text": " ".join(text_parts),
        "metadata": {
            "total_annual_recharge_ham": total_annual,
            "extractable_resource_ham": extractable,
            "extraction_total_ham": extraction_total,
            "net_availability_ham": net_availability,
            "stage_of_extraction_percent": stage_of_extraction,
        },
    }


def build_annexure3_chunks(
    data: dict, year: str, source: str
) -> Generator[Dict, None, None]:
    """Build semantic chunks from Annexure 3 (categorization tables)."""

    # State categorization (3a)
    for record in data.get("annexure_3a_state_categorization", []):
        state = clean_name(record.get("state"), "state")
        if not state:
            continue

        total = record.get("total_assessed_units", 0)
        safe = get_nested(record, "safe", "count", default=0)
        safe_pct = get_nested(record, "safe", "percent", default=0)
        semi_critical = get_nested(record, "semi_critical", "count", default=0)
        critical = get_nested(record, "critical", "count", default=0)
        over_exploited = get_nested(record, "over_exploited", "count", default=0)
        saline = get_nested(record, "saline", "count", default=0)

        text_parts = [f"**{state} ({year}) - Unit Categorization (Annexure 3A)**"]
        text_parts.append(f"Total assessed units: {int(total)}.")

        cats = []
        if safe:
            cats.append(f"Safe: {int(safe)} ({safe_pct:.1f}%)")
        if semi_critical:
            cats.append(f"Semi-critical: {int(semi_critical)}")
        if critical:
            cats.append(f"Critical: {int(critical)}")
        if over_exploited:
            cats.append(f"Over-exploited: {int(over_exploited)}")
        if saline:
            cats.append(f"Saline: {int(saline)}")

        text_parts.append(" | ".join(cats) + ".")

        yield {
            "id": generate_id(state, None, None, year, "annexure3a"),
            "state": state,
            "district": None,
            "block": None,
            "year": year,
            "source_type": "annexure_3a",
            "source": source,
            "categorization": None,
            "text": " ".join(text_parts),
            "metadata": {
                "total_units": int(total),
                "safe_count": int(safe),
                "over_exploited_count": int(over_exploited),
                "critical_count": int(critical),
            },
        }

    # State extractable resources (3c)
    for record in data.get("annexure_3c_state_extractable_resource", []):
        state = clean_name(record.get("state"), "state")
        if not state:
            continue

        total_resource = record.get("total_extractable_resource_ham", 0)
        safe_resource = get_nested(record, "safe", "resource_ham", default=0)
        over_exploited_resource = get_nested(
            record, "over_exploited", "resource_ham", default=0
        )

        text_parts = [
            f"**{state} ({year}) - Extractable Resource by Category (Annexure 3C)**"
        ]
        text_parts.append(
            f"Total extractable resource: {format_value(total_resource)} ham."
        )

        if safe_resource:
            text_parts.append(
                f"Resource in safe areas: {format_value(safe_resource)} ham."
            )
        if over_exploited_resource:
            text_parts.append(
                f"Resource in over-exploited areas: {format_value(over_exploited_resource)} ham."
            )

        yield {
            "id": generate_id(state, None, None, year, "annexure3c"),
            "state": state,
            "district": None,
            "block": None,
            "year": year,
            "source_type": "annexure_3c",
            "source": source,
            "categorization": None,
            "text": " ".join(text_parts),
            "metadata": {
                "total_extractable_ham": total_resource,
                "safe_resource_ham": safe_resource,
                "over_exploited_resource_ham": over_exploited_resource,
            },
        }

    # State area categorization (3e)
    for record in data.get("annexure_3e_state_area_categorization", []):
        state = clean_name(record.get("state"), "state")
        if not state:
            continue

        total_area = record.get("total_geographical_area_sq_km", 0)
        recharge_worthy = record.get("recharge_worthy_area_sq_km", 0)
        safe_area = get_nested(record, "safe", "area_sq_km", default=0)
        over_exploited_area = get_nested(
            record, "over_exploited", "area_sq_km", default=0
        )

        text_parts = [f"**{state} ({year}) - Area by Category (Annexure 3E)**"]
        text_parts.append(f"Total geographical area: {format_value(total_area)} sq km.")
        text_parts.append(
            f"Recharge-worthy area: {format_value(recharge_worthy)} sq km."
        )

        if safe_area:
            text_parts.append(
                f"Area under safe category: {format_value(safe_area)} sq km."
            )
        if over_exploited_area:
            text_parts.append(
                f"Area under over-exploited category: {format_value(over_exploited_area)} sq km."
            )

        yield {
            "id": generate_id(state, None, None, year, "annexure3e"),
            "state": state,
            "district": None,
            "block": None,
            "year": year,
            "source_type": "annexure_3e",
            "source": source,
            "categorization": None,
            "text": " ".join(text_parts),
            "metadata": {
                "total_area_sq_km": total_area,
                "recharge_worthy_sq_km": recharge_worthy,
                "safe_area_sq_km": safe_area,
                "over_exploited_area_sq_km": over_exploited_area,
            },
        }


def build_annexure4_chunks(
    data: dict, year: str, source: str
) -> Generator[Dict, None, None]:
    """Build semantic chunks from Annexure 4 (problem units)."""

    # Group by state for categorized units
    state_problems = defaultdict(
        lambda: {"semi_critical": [], "critical": [], "over_exploited": []}
    )

    for record in data.get("annexure_4a_categorized_units", []):
        state = clean_name(record.get("state"), "state")
        district = clean_name(record.get("district"), "district")

        if not state:
            continue

        for unit_type, status in [
            ("semi_critical_unit", "semi_critical"),
            ("critical_unit", "critical"),
            ("over_exploited_unit", "over_exploited"),
        ]:
            unit_name = record.get(unit_type, "")
            if unit_name and unit_name.strip():
                state_problems[state][status].append(
                    f"{clean_name(unit_name)} ({district})"
                )

    # Create chunks per state
    for state, problems in state_problems.items():
        text_parts = [
            f"**{state} ({year}) - Stressed Groundwater Units (Annexure 4A)**"
        ]

        if problems["over_exploited"]:
            text_parts.append(
                f"Over-exploited units: {', '.join(problems['over_exploited'][:10])}"
            )
            if len(problems["over_exploited"]) > 10:
                text_parts[-1] += f" and {len(problems['over_exploited']) - 10} more"
            text_parts[-1] += "."

        if problems["critical"]:
            text_parts.append(f"Critical units: {', '.join(problems['critical'][:10])}")
            if len(problems["critical"]) > 10:
                text_parts[-1] += f" and {len(problems['critical']) - 10} more"
            text_parts[-1] += "."

        if problems["semi_critical"]:
            text_parts.append(
                f"Semi-critical units: {', '.join(problems['semi_critical'][:10])}"
            )
            if len(problems["semi_critical"]) > 10:
                text_parts[-1] += f" and {len(problems['semi_critical']) - 10} more"
            text_parts[-1] += "."

        yield {
            "id": generate_id(state, None, None, year, "annexure4a"),
            "state": state,
            "district": None,
            "block": None,
            "year": year,
            "source_type": "annexure_4a",
            "source": source,
            "categorization": "has_stressed_units",
            "text": " ".join(text_parts),
            "metadata": {
                "over_exploited_units": len(problems["over_exploited"]),
                "critical_units": len(problems["critical"]),
                "semi_critical_units": len(problems["semi_critical"]),
            },
        }

    # Group quality problems by state
    state_quality = defaultdict(lambda: {"fluoride": [], "arsenic": [], "salinity": []})

    for record in data.get("annexure_4b_quality_problems", []):
        state = clean_name(record.get("state"), "state")
        district = clean_name(record.get("district"), "district")

        if not state:
            continue

        for problem_type, problem_name in [
            ("fluoride_affected_unit", "fluoride"),
            ("arsenic_affected_unit", "arsenic"),
            ("salinity_affected_unit", "salinity"),
        ]:
            unit_name = record.get(problem_type, "")
            if unit_name and unit_name.strip():
                state_quality[state][problem_name].append(
                    f"{clean_name(unit_name)} ({district})"
                )

    for state, quality in state_quality.items():
        text_parts = [f"**{state} ({year}) - Water Quality Issues (Annexure 4B)**"]

        if quality["fluoride"]:
            text_parts.append(
                f"Fluoride-affected units: {', '.join(quality['fluoride'][:8])}"
            )
            if len(quality["fluoride"]) > 8:
                text_parts[-1] += f" and {len(quality['fluoride']) - 8} more"
            text_parts[-1] += "."

        if quality["arsenic"]:
            text_parts.append(
                f"Arsenic-affected units: {', '.join(quality['arsenic'][:8])}"
            )
            if len(quality["arsenic"]) > 8:
                text_parts[-1] += f" and {len(quality['arsenic']) - 8} more"
            text_parts[-1] += "."

        if quality["salinity"]:
            text_parts.append(
                f"Salinity-affected units: {', '.join(quality['salinity'][:8])}"
            )
            if len(quality["salinity"]) > 8:
                text_parts[-1] += f" and {len(quality['salinity']) - 8} more"
            text_parts[-1] += "."

        yield {
            "id": generate_id(state, None, None, year, "annexure4b"),
            "state": state,
            "district": None,
            "block": None,
            "year": year,
            "source_type": "annexure_4b",
            "source": source,
            "categorization": "has_quality_issues",
            "text": " ".join(text_parts),
            "metadata": {
                "fluoride_affected_units": len(quality["fluoride"]),
                "arsenic_affected_units": len(quality["arsenic"]),
                "salinity_affected_units": len(quality["salinity"]),
            },
        }


# ============================================================================
# MAIN PROCESSING
# ============================================================================


def process_all_sources():
    """Process all data sources and generate semantic chunks."""

    total_chunks = 0
    counts = defaultdict(int)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as outfile:
        # 1. State Reports
        state_reports_dir = BASE_DIR / "state_reports"
        if state_reports_dir.exists():
            print(f"\n📂 Processing state reports...")
            for filepath in sorted(state_reports_dir.glob("*.json")):
                print(f"  📄 {filepath.name}")
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)

                state = clean_name(data.get("state"), "state")
                year = data.get("year", "")
                source = f"state_reports/{filepath.name}"

                for idx, record in enumerate(data.get("data", [])):
                    chunk = build_state_report_chunk(record, state, year, source, idx)
                    if chunk:
                        outfile.write(json.dumps(chunk, ensure_ascii=False) + "\n")
                        total_chunks += 1
                        counts["state_report"] += 1

        # 2. Central Reports
        central_reports_dir = BASE_DIR / "central_reports"
        if central_reports_dir.exists():
            print(f"\n📂 Processing central reports...")
            for filepath in sorted(central_reports_dir.glob("*.json")):
                print(f"  📄 {filepath.name}")
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)

                year = data.get("year", "")
                source = f"central_reports/{filepath.name}"

                for idx, record in enumerate(data.get("records", [])):
                    chunk = build_central_report_chunk(record, year, source, idx)
                    if chunk:
                        outfile.write(json.dumps(chunk, ensure_ascii=False) + "\n")
                        total_chunks += 1
                        counts["central_report"] += 1

        # 3. Attribute Reports
        attribute_reports_dir = BASE_DIR / "attribute_reports"
        if attribute_reports_dir.exists():
            print(f"\n📂 Processing attribute reports...")
            for filepath in sorted(attribute_reports_dir.glob("*.json")):
                print(f"  📄 {filepath.name}")
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)

                year = data.get("year", "")
                source = f"attribute_reports/{filepath.name}"

                # Summary
                for record in data.get("summary", []):
                    chunk = build_attribute_summary_chunk(record, year, source)
                    if chunk:
                        outfile.write(json.dumps(chunk, ensure_ascii=False) + "\n")
                        total_chunks += 1
                        counts["attribute_summary"] += 1

                # Detailed
                for idx, record in enumerate(data.get("detailed_table", [])):
                    chunk = build_attribute_detailed_chunk(record, year, source, idx)
                    if chunk:
                        outfile.write(json.dumps(chunk, ensure_ascii=False) + "\n")
                        total_chunks += 1
                        counts["attribute_detailed"] += 1

        # 4. Annexures
        annexures_dir = BASE_DIR / "annexures"
        if annexures_dir.exists():
            print(f"\n📂 Processing annexures...")

            # Annexure 1
            for filepath in sorted(annexures_dir.glob("annexure1_*.json")):
                print(f"  📄 {filepath.name}")
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                year = data.get("year", "")
                source = f"annexures/{filepath.name}"

                for record in data.get("records", []):
                    chunk = build_annexure1_chunk(record, year, source)
                    if chunk:
                        outfile.write(json.dumps(chunk, ensure_ascii=False) + "\n")
                        total_chunks += 1
                        counts["annexure_1"] += 1

            # Annexure 2
            for filepath in sorted(annexures_dir.glob("annexure2_*.json")):
                print(f"  📄 {filepath.name}")
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                year = data.get("year", "")
                source = f"annexures/{filepath.name}"

                for record in data.get("records", []):
                    chunk = build_annexure2_chunk(record, year, source)
                    if chunk:
                        outfile.write(json.dumps(chunk, ensure_ascii=False) + "\n")
                        total_chunks += 1
                        counts["annexure_2"] += 1

            # Annexure 3
            for filepath in sorted(annexures_dir.glob("annexure3_*.json")):
                print(f"  📄 {filepath.name}")
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                year = data.get("year", "")
                source = f"annexures/{filepath.name}"

                for chunk in build_annexure3_chunks(data, year, source):
                    outfile.write(json.dumps(chunk, ensure_ascii=False) + "\n")
                    total_chunks += 1
                    counts["annexure_3"] += 1

            # Annexure 4
            for filepath in sorted(annexures_dir.glob("annexure4_*.json")):
                print(f"  📄 {filepath.name}")
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                year = data.get("year", "")
                source = f"annexures/{filepath.name}"

                for chunk in build_annexure4_chunks(data, year, source):
                    outfile.write(json.dumps(chunk, ensure_ascii=False) + "\n")
                    total_chunks += 1
                    counts["annexure_4"] += 1

    return total_chunks, dict(counts)


def main():
    """Main entry point."""
    print("=" * 70)
    print("🚀 SEMANTIC CHUNKER FOR GROUNDWATER RAG")
    print("=" * 70)
    print(f"\n📁 Base directory: {BASE_DIR}")
    print(f"📤 Output file: {OUTPUT_FILE}")

    start_time = datetime.now()
    total, counts = process_all_sources()
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    print("\n" + "=" * 70)
    print("✅ PROCESSING COMPLETE!")
    print("=" * 70)
    print(f"\n📊 STATISTICS:")
    print(f"  Total chunks generated: {total:,}")
    print(f"\n  By source type:")
    for source_type, count in sorted(counts.items()):
        print(f"    • {source_type}: {count:,}")

    print(f"\n⏱️  Processing time: {duration:.2f} seconds")

    if OUTPUT_FILE.exists():
        size_mb = OUTPUT_FILE.stat().st_size / (1024 * 1024)
        print(f"💾 File size: {size_mb:.2f} MB")

    # Show samples
    print("\n" + "=" * 70)
    print("🎯 SAMPLE CHUNKS:")
    print("=" * 70)

    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if i >= 3:
                break
            chunk = json.loads(line)
            print(f"\n📝 Chunk {i + 1}:")
            print(f"   ID: {chunk['id']}")
            print(f"   Location: {chunk['state']}", end="")
            if chunk["district"]:
                print(f" > {chunk['district']}", end="")
            if chunk["block"]:
                print(f" > {chunk['block']}", end="")
            print(f" ({chunk['year']})")
            print(f"   Source: {chunk['source_type']}")
            print(f"   Text: {chunk['text'][:200]}...")
            print(f"   Metadata: {json.dumps(chunk['metadata'], indent=2)[:150]}...")


if __name__ == "__main__":
    main()
