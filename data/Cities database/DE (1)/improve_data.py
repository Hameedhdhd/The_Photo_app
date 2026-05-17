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
    
    # 1. Basic Cleaning
    # Keep only needed columns
    df = df[["postal_code", "city", "state"]]
    df["country"] = "Germany"
    
    # 2. Advanced Company Filtering
    # German GeoNames often includes specific company names or institutions for certain postcodes.
    # We want a clean list of cities/towns.
    companies_regex = r'(?i)\b(GmbH|AG|KG|Co\.|Verein|Bank|Versicherung|Management|Vertrieb|mbH|Inc|Corp|Service|Finanzamt|Agentur|Familienkasse|Postbank|Krankenkasse|Universität|University|Hospital|Klinik|Kirche|Evangelische|Katholische|Justizvollzugsanstalt|Bundeswehr|Ministerium|Behörde|AOK|HUK|Vorsorge|LBS|Landesbank|Sparkasse|Volksbank|Deutsche Post|Telekom|Daimler|Mercedes-Benz|Volkswagen|BMW|Audi|Siemens|Bosch|Rundfunk|Landesbibliothek)\b'
    
    # Filter out companies/institutions
    mask = ~df['city'].str.contains(companies_regex, na=False)
    df_clean = df[mask].copy()
    
    # Also filter by word count - most German cities are 1-3 words. 
    # Long names are usually specific buildings or departments.
    df_clean = df_clean[df_clean['city'].str.split().str.len() <= 4]

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
    
    # 3. Clean up the names (fix encoding issues if any persist)
    # If the file was double-encoded, we might need to fix it. 
    # But pd.read_csv with utf-8 usually handles it.
    
    # 4. Deduplication
    # Sometimes there are multiple entries for the same postcode and city due to different admin levels
    df_clean = df_clean.drop_duplicates(subset=["postal_code", "city", "state"])
    
    # Sort for better presentation
    df_clean = df_clean.sort_values(["postal_code", "city"])
    
    # 5. Rename columns for clarity
    df_clean.columns = ["Postal Code", "City", "State", "Country"]
    
    print(f"Final rows after cleaning: {len(df_clean)}")
    
    # Save with UTF-8 encoding and index=False
    df_clean.to_csv(OUTPUT_FILE, index=False, encoding='utf-8-sig') # utf-8-sig adds BOM for Excel
    
    print(f"Saved to {OUTPUT_FILE}")
    return OUTPUT_FILE

if __name__ == "__main__":
    improve_data()
