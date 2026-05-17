#!/usr/bin/env python3
"""
Fetch German postal codes from GitHub gist and generate SQL migration
"""
import re
import json

# The gist URL contains the data - we'll parse it
# Format: Ort;Plz;Bundesland
gist_url = "https://gist.githubusercontent.com/pmdroid/6ae8286a494cafce82b6ea5f6cc2362a/raw"

try:
    import urllib.request
    response = urllib.request.urlopen(gist_url)
    data = response.read().decode('utf-8')
except Exception as e:
    print(f"Error fetching gist: {e}")
    print("Using sample data instead...")
    data = """Ort;Plz;Bundesland
Aach;54298;Rheinland-Pfalz
Aach;78267;Baden-Württemberg
Aalzenhausen;56329;Rheinland-Pfalz
Aarbergen;65326;Hessen"""

# Parse the CSV data
lines = data.strip().split('\n')
header = lines[0].split(';')  # Skip header
addresses = []

for line in lines[1:]:
    if not line.strip():
        continue
    parts = line.split(';')
    if len(parts) >= 3:
        city = parts[0].strip()
        postal_code = parts[1].strip()
        state = parts[2].strip()
        addresses.append({
            'city': city,
            'postal_code': postal_code,
            'state': state,
            'country': 'Germany'
        })

print(f"Parsed {len(addresses)} German addresses")

# Generate SQL migration
sql_lines = [
    "-- German Postal Codes Migration",
    "-- Auto-generated from GitHub gist",
    "",
    "-- Create table",
    "CREATE TABLE IF NOT EXISTS public.german_addresses (",
    "  id BIGSERIAL PRIMARY KEY,",
    "  postal_code VARCHAR(5) NOT NULL,",
    "  city VARCHAR(100) NOT NULL,",
    "  state VARCHAR(50),",
    "  country VARCHAR(50) DEFAULT 'Germany',",
    "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,",
    "  UNIQUE(postal_code, city)",
    ");",
    "",
    "-- Create index for faster lookups",
    "CREATE INDEX IF NOT EXISTS idx_german_addresses_postal_code ON public.german_addresses(postal_code);",
    "CREATE INDEX IF NOT EXISTS idx_german_addresses_city ON public.german_addresses(city);",
    "",
    "-- Insert postal code data",
]

# Add INSERT statements (batch them for efficiency)
insert_values = []
for addr in addresses:
    city_escaped = addr['city'].replace("'", "''")
    state_escaped = addr['state'].replace("'", "''")
    insert_values.append(f"('{addr['postal_code']}', '{city_escaped}', '{state_escaped}', 'Germany')")

# Batch inserts in groups of 100
batch_size = 100
for i in range(0, len(insert_values), batch_size):
    batch = insert_values[i:i+batch_size]
    sql_lines.append(f"INSERT INTO public.german_addresses (postal_code, city, state, country) VALUES")
    sql_lines.append(',\n  '.join(batch) + ";")

sql_content = '\n'.join(sql_lines)

# Save to file
output_path = "supabase/german_addresses_migration.sql"
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(sql_content)

print(f"✓ Generated SQL migration: {output_path}")
print(f"  Total addresses: {len(addresses)}")
print(f"  File size: {len(sql_content)} bytes")
