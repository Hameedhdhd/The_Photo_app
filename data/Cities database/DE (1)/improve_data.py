import pandas as pd
import os

# File paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(BASE_DIR, "DE.txt")
OUTPUT_FILE = os.path.join(BASE_DIR, "German ZIP Codes (Postleitzahl) 2026.csv")

def improve_data():
    print(f"Reading {INPUT_FILE}...")
    
    # Define columns based on GeoNames format
    columns = [
        "country_code", "postal_code", "city", "state", "admin_code1",
        "admin_name2", "admin_code2", "admin_name3", "admin_code3", 
        "latitude", "longitude", "accuracy"
    ]
    
    # Read with UTF-8 encoding. If it fails, try latin-1
    try:
        df = pd.read_csv(INPUT_FILE, sep="\t", header=None, names=columns, dtype=str, encoding='utf-8')
    except UnicodeDecodeError:
        df = pd.read_csv(INPUT_FILE, sep="\t", header=None, names=columns, dtype=str, encoding='latin-1')
        
    print(f"Initial rows: {len(df)}")
    print(f"DEBUG: 22041 entries before filtering: {len(df[df['postal_code'] == '22041'])}")
    
    # 1. Basic Cleaning
    # Keep only needed columns
    df = df[["postal_code", "city", "state"]]
    df["country"] = "Germany"
    print(f"DEBUG: 22041 entries after basic cleaning: {len(df[df['postal_code'] == '22041'])}")
    
    # 2. Advanced Company Filtering
    # German GeoNames often includes specific company names or institutions for certain postcodes.
    # We want a clean list of cities/towns, but NOT filter out legitimate district/neighborhood names.
    
    # Filter using ONLY clear company/institution indicators
    # Focus on: company legal forms, large organizations, government buildings
    companies_regex = r'(?i)\b(?:GmbH|AG|KG|Co\.|Verein|Bank|Versicherung|Management|Vertrieb|mbH|Inc|Corp|Service|Ltd|eG|OHG|KgaA|eV|Daimler|Mercedes-Benz|Volkswagen|BMW|Audi|Siemens|Bosch|Telekom|Deutsche Post|Finanzamt|Agentur|Behörde|Ministerium|Gericht|Amt|Universität|Hospital|Klinik|Schule|Institut|Firma|Unternehmen|Gesellschaft|Betrieb|Büro|Filiale|Zentrale|Verwaltung|Zentrum)\b'
    
    # Filter out only clear companies/institutions
    mask = ~df['city'].str.contains(companies_regex, na=False, regex=True)
    df_clean = df[mask].copy()
    print(f"DEBUG: 22041 entries after company filter: {len(df_clean[df_clean['postal_code'] == '22041'])}")
    
    # Less aggressive word count - allow up to 3 words
    # (Hamburg Friedrichstadt, Hamburg Marienthal, etc. are legitimate)
    word_count = df_clean['city'].str.split().str.len()
    mask_words = word_count <= 3
    df_clean = df_clean[mask_words]
    print(f"DEBUG: 22041 entries after word count filter: {len(df_clean[df_clean['postal_code'] == '22041'])}")
    
    # Remove entries that contain numbers (company IDs, building numbers, etc.)
    mask_no_numbers = ~df_clean['city'].str.contains(r'\d', na=False, regex=True)
    df_clean = df_clean[mask_no_numbers]
    print(f"DEBUG: 22041 entries after number filter: {len(df_clean[df_clean['postal_code'] == '22041'])}")
    
    # Remove entries with obvious company endings
    # But keep hyphenated names like "Bad-Säckingen"
    mask_no_company_endings = ~df_clean['city'].str.contains(r'(?i)\s+(GmbH|AG|KG|Co\.|Services|LLC|Corp|Group|Abteilung|Dienst|Fabrik|Werk|Büro|Station|Center|Centre)$', na=False, regex=True)
    df_clean = df_clean[mask_no_company_endings]
    print(f"DEBUG: 22041 entries after company ending filter: {len(df_clean[df_clean['postal_code'] == '22041'])}")

    # 3. Normalize State Names (English to German)
    state_mapping = {
        'Saxony': 'Sachsen',
        'Bavaria': 'Bayern',
        'Hesse': 'Hessen',
        'Lower Saxony': 'Niedersachsen',
        'North Rhine-Westphalia': 'Nordrhein-Westfalen',
        'Rhineland-Palatinate': 'Rheinland-Pfalz',
        'Thuringia': 'Thüringen',
        'Brandenburg': 'Brandenburg',
        'Berlin': 'Berlin',
        'Bremen': 'Bremen',
        'Hamburg': 'Hamburg',
        'Saarland': 'Saarland',
        'Schleswig-Holstein': 'Schleswig-Holstein',
        'Baden-Württemberg': 'Baden-Württemberg',
        'Mecklenburg-Western Pomerania': 'Mecklenburg-Vorpommern',
        'Saxony-Anhalt': 'Sachsen-Anhalt'
    }
    df_clean['state'] = df_clean['state'].replace(state_mapping)
    print(f"DEBUG: 22041 entries after state normalization: {len(df_clean[df_clean['postal_code'] == '22041'])}")
    
    # 3. Clean up the names (fix encoding issues if any persist)
    # If the file was double-encoded, we might need to fix it. 
    # But pd.read_csv with utf-8 usually handles it.
    
    # 4. Deduplication
    # Sometimes there are multiple entries for the same postcode and city due to different admin levels
    df_clean = df_clean.drop_duplicates(subset=["postal_code", "city", "state"])
    print(f"DEBUG: 22041 entries after deduplication: {len(df_clean[df_clean['postal_code'] == '22041'])}")
    if len(df_clean[df_clean['postal_code'] == '22041']) > 0:
        print("DEBUG: 22041 entries after dedup:")
        print(df_clean[df_clean['postal_code'] == '22041'][['postal_code', 'city', 'state']])
    
    # Sort for better presentation
    df_clean = df_clean.sort_values(["postal_code", "city"])
    print(f"DEBUG: 22041 entries after sort: {len(df_clean[df_clean['postal_code'] == '22041'])}")
    
    # 5. Rename columns for clarity
    df_clean.columns = ["Postal Code", "City", "State", "Country"]
    print(f"DEBUG: 22041 entries after rename: {len(df_clean[df_clean['Postal Code'] == '22041'])}")
    if len(df_clean[df_clean['Postal Code'] == '22041']) > 0:
        print("DEBUG: Final 22041 entries before save:")
        print(df_clean[df_clean['Postal Code'] == '22041'][['Postal Code', 'City', 'State']])
    
    print(f"Final rows after cleaning: {len(df_clean)}")
    
    # Save with UTF-8 encoding and index=False
    print(f"DEBUG: Dataframe shape before save: {df_clean.shape}")
    print(f"DEBUG: Dataframe columns: {df_clean.columns.tolist()}")
    print(f"DEBUG: Unique postal codes containing '2204': {df_clean[df_clean['Postal Code'].str.contains('2204', na=False)]['Postal Code'].unique().tolist()}")
    
    # Save to CSV
    df_clean.to_csv(OUTPUT_FILE, index=False, encoding='utf-8')
    
    # Verify the file was written
    import os as os_module
    if os_module.path.exists(OUTPUT_FILE):
        file_size = os_module.path.getsize(OUTPUT_FILE)
        print(f"File saved successfully. Size: {file_size} bytes")
        
        # Quick verification - read back and check for 22041
        df_verify = pd.read_csv(OUTPUT_FILE)
        verify_count = len(df_verify[df_verify['Postal Code'] == '22041'])
        print(f"Verification: Found {verify_count} entries for 22041 in saved file")
    else:
        print(f"ERROR: File was not created at {OUTPUT_FILE}")
    
    print(f"Saved to {OUTPUT_FILE}")
    return OUTPUT_FILE

if __name__ == "__main__":
    improve_data()
