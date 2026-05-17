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
    
    # Check 22041 before filtering
    print(f"\n🔍 DEBUG: Postal code 22041 before any filters: {len(df[df['postal_code'] == '22041'])}")
    print(df[df['postal_code'] == '22041'][['postal_code', 'city', 'state']])
    
    # 1. Basic Cleaning
    df = df[["postal_code", "city", "state"]]
    df["country"] = "Germany"
    
    print(f"\n🔍 DEBUG: After basic cleaning, 22041 entries: {len(df[df['postal_code'] == '22041'])}")
    
    # 2. Advanced Company Filtering
    companies_regex = r'(?i)(?:GmbH|AG|KG|Co\.|Verein|Bank|Versicherung|Management|Vertrieb|mbH|Inc|Corp|Service|Finanzamt|Agentur|Familienkasse|Postbank|Krankenkasse|Universität|University|Hospital|Klinik|Kirche|Evangelische|Katholische|Justizvollzugsanstalt|Bundeswehr|Ministerium|Behörde|AOK|HUK|Vorsorge|LBS|Landesbank|Sparkasse|Volksbank|Deutsche Post|Telekom|Daimler|Mercedes-Benz|Volkswagen|BMW|Audi|Siemens|Bosch|Rundfunk|Landesbibliothek|Ltd|eG|OHG|KgaA|eV|Gesellschaft|Unternehmensgruppe|Niederlassung|Zentrale|Zentrum|Institut|Schule|Gymnasium|Oberschule|Realschule|Grundschule|Volkshochschule|Fachhochschule|Technische|Akademie|Berufsschule|Fachschule|Betrieb|Werk|Fabrik|Produktionsstätte|Labor|Forschung|Entwicklung|Büro|Filiale|Zweigstelle|Hauptsitz|Verwaltung|Praxis|Kanzlei|Anwalt|Steuerberater|Wirtschaftsprüfer|Notariat|Versicherungsmakler|Makler|Agentin|Promoter|Sponsor|Medienunternehmen|Verlag|Druckerei|Zeitungsverlag|Rundfunkstudio|Fernsehstudio|Radiostation|Sender|Fernsehen|Fernsehsender|Zeitung|Druckunternehmen|Logistik|Spedition|Transport|Umzugsunternehmen|Busunternehmen|Taxiunternehmen|Mietwagenzentrale|Carsharing|Tankstelle|Benzinstation|Raststätte|Rastplatz|Restaurant|Gaststätte|Hotel|Herberge|Pension|Motel|Gasthof|Wirtshaus|Pizzeria|Bäckerei|Konditorei|Metzgerei|Fleischerei|Supermarkt|Einzelhandelskette|Einkaufszentrum|Einkaufsmarkt|Kaufhaus|Warenhaus|Boutique|Bekleidungsgeschäft|Schuhladen|Buchhandlung|Antiquariat|Sanitätshaus|Apotheke|Arztpraxis|Zahnarztpraxis|Tierarztpraxis|Veterinär|Zahnklinik|Tierklinik|Fitnessstudio|Sportclub|Sportverein|Tennisclub|Golfclub|Schwimmbad|Hallenbad|Freibad|Sauna|Wellnessanlage|Spa|Massage|Kurort|Sanatorium|Rehabilitationszentrum|Pflegeheim|Altenheim|Seniorenheim|Kindergarten|Kindertagesstätte|Vorschule|Schulhaus|Schulgebäude|Campus|Studentenwohnheim|Studentenwerk|Mensa|Bibliothek|Archiv|Museum|Kunstmuseum|Naturkundemuseum|Technikmuseum|Heimatmuseum|Schloss|Burg|Festung|Denkmal|Gedenkstätte|Mahnmal|Gedächtnisstätte|Kriegerdenkmal|Ruine|Ausgrabungsstätte|Archäologischer|Theater|Kino|Opernhaus|Konzertsaal|Philharmonie|Orchester|Symphonie|Operette|Ballett|Tanzschule|Musikschule|Kunstschule|Handwerkskammer|Industrie-und Handelskammer|IHK|Handwerksinnung|Berufsgenossenschaft|Sozialversicherungsträger|Krankenkasse|Rentenversicherung|Arbeitslosenversicherung|Unfallversicherung|Pflegeversicherung|Versorgungswerk|Versicherungsbüro|Versicherungsmaklerbüro|Rechtsschutzversicherung|Generalagentur|Verkaufsagentur|Handelsvertretung|Vertragshändler|Franchiser|Franchisee|Lizenzgeber|Lizenznehmer|Pachtbetrieb|Leasing-unternehmen|Leasing-gesellschaft|Factoring|Creditworthiness|Finanzierungsgesellschaft|Kreditinstitut|Kreditgenossenschaft|Baugenossenschaft|Wohnungsgenossenschaft|Wohnungsgenossenschaftsverband|Wohnungsgesellschaft|Wohnungsunternehmen|Immobilienunternehmen|Maklerunternehmen|Grundstücksgesellschaft|Verwaltungsgesellschaft|Holding|Beteiligungsgesellschaft|Investmentgesellschaft|Fondsgesellschaft|Treuhandgesellschaft|Stiftung|Gemeinschaft|Verband|Interessenvereinigung|Berufsverband|Handelskammer|Kammer|Innungsverband|Sicherheitsunternehmen|Wachschutz|Privatdetektiv|Sicherheitsdienst|Pfortendienst|Empfangsdienst|Bewachung|Schließanlage|Schloss|Schlüsseldienst|Ablesung|Ablesedienst|Tarifvertrag|Tarifvertragspartei|Arbeitgeber|Arbeitgeber-verband|Arbeitnehmerkammer|Betriebsrat|Personalrat|Gewerkschaft|Industriegewerkschaft|Beamtenverband|Künstlerverband|Sportverband|Turnverband|Schützenverein|Schießstand|Kegelclub|Bowlingbahn|Billardhalle|Spielhalle|Spielcasino|Wettannahmestelle|Wettbüro|Lotterie|Lotterieagentur|Toto-annahmestelle|Glücksspielstätte|Spielbank|Spielkasino|Sportbar|Billardbar|Kneipe|Diskothek|Disko|Nachtclub|Stripclub|Saunaclub|Erotikclub|Massagesalon|Bordell|Etablissement|Freudenhaus|Aufbaubank|Staatskanzlei|Regierungspräsidium|Oberlandesgericht|Landgericht|Amtsgericht|Verwaltungsgericht|Arbeitsgericht|Finanzgericht|Bundesnetzagentur|Kartellamt|Bundeszentralamt|Landeszentralamt|Statistisches Landesamt|Landesamt|Amt für|Ausgleichsamt|Wohnungsamt|Ordnungsamt|Bauamt|Denkmalschutzamt|Kulturamt|Sozialamt|Gesundheitsamt|Veterinäramt|Katasteramt|Flächennutzungsplan|Naturschutzbehörde|Wasserwirtschaft|Straßenbahnamt|Verkehrsbetrieb)\b'
    
    # Filter out companies/institutions
    mask = ~df['city'].str.contains(companies_regex, na=False, regex=True)
    df_clean = df[mask].copy()
    
    print(f"\n🔍 DEBUG: After company filter, 22041 entries: {len(df_clean[df_clean['postal_code'] == '22041'])}")
    print(df_clean[df_clean['postal_code'] == '22041'][['postal_code', 'city', 'state']])
    
    # Word count filter
    word_count = df_clean['city'].str.split().str.len()
    mask_words = (word_count <= 2) | ((word_count == 3) & (df_clean['city'].str.split().str[0].isin(['Bad', 'Neu', 'Groß', 'Klein', 'Alt', 'Ober', 'Unter', 'Nord', 'Süd', 'Ost', 'West'])))
    df_clean = df_clean[mask_words]
    
    print(f"\n🔍 DEBUG: After word count filter, 22041 entries: {len(df_clean[df_clean['postal_code'] == '22041'])}")
    print(df_clean[df_clean['postal_code'] == '22041'][['postal_code', 'city', 'state']])
    
    # No numbers filter
    mask_no_numbers = ~df_clean['city'].str.contains(r'\d', na=False, regex=True)
    df_clean = df_clean[mask_no_numbers]
    
    print(f"\n🔍 DEBUG: After no-numbers filter, 22041 entries: {len(df_clean[df_clean['postal_code'] == '22041'])}")
    
    # Clean characters filter
    mask_clean_chars = df_clean['city'].str.match(r'^[a-zA-ZäöüßÄÖÜ\s\-]*$', na=False)
    df_clean = df_clean[mask_clean_chars]
    
    print(f"\n🔍 DEBUG: After clean-chars filter, 22041 entries: {len(df_clean[df_clean['postal_code'] == '22041'])}")
    print(df_clean[df_clean['postal_code'] == '22041'][['postal_code', 'city', 'state']])

    # 3. Normalize State Names
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
    
    # 4. Deduplication
    df_clean = df_clean.drop_duplicates(subset=["postal_code", "city", "state"])
    
    print(f"\n🔍 DEBUG: After deduplication, 22041 entries: {len(df_clean[df_clean['postal_code'] == '22041'])}")
    print(df_clean[df_clean['postal_code'] == '22041'][['postal_code', 'city', 'state']])
    
    # Sort for better presentation
    df_clean = df_clean.sort_values(["postal_code", "city"])
    
    # 5. Rename columns for clarity
    df_clean.columns = ["Postal Code", "City", "State", "Country"]
    
    print(f"\nFinal rows after cleaning: {len(df_clean)}")
    
    # Save with UTF-8 encoding and index=False
    df_clean.to_csv(OUTPUT_FILE, index=False, encoding='utf-8-sig')
    
    print(f"Saved to {OUTPUT_FILE}")
    return OUTPUT_FILE

if __name__ == "__main__":
    improve_data()
