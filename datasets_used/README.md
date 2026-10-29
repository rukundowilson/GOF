# Datasets used by GOF+

This folder collects copies of the project’s agricultural data files in one place. The original files remain in `assets/`, where the app expects them.

## Files and how the app uses them

- `rwanda-plant-variety-list-2025.json` — imported by the pre-season analysis API. It supplies registered crop varieties and source-page details used to check seed recommendations.
- `rwanda-district-topography.json` — imported by the pre-season analysis API for district-level altitude and terrain context.
- `rwanda-plant-variety-list-2025.csv` — CSV copy of the plant variety data, kept as a convenient source/reference format. The app imports the JSON file.
- `rwanda_districts_topography_dataset.csv` — CSV source/reference file for the district topography data. The app imports the JSON file.
- `Weather_Forecast_for_October_2026.pdf` — Meteo Rwanda forecast cited by the pre-season analysis. The API currently uses weather summaries embedded in its code; it does not load this PDF at runtime.

## Original locations

The app’s active JSON imports and the supporting source files are in `assets/`. These files here are copies for dataset review and sharing.
