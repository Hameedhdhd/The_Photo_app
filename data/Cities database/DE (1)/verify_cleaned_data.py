import pandas as pd

# Read the cleaned CSV
df = pd.read_csv('German ZIP Codes (Postleitzahl) 2026.csv')

print('DATA QUALITY REPORT')
print('=' * 70)
print(f'Total records: {len(df):,}')
print(f'Unique cities: {df["City"].nunique():,}')
print(f'Unique postal codes: {df["Postal Code"].nunique():,}')
print(f'States represented: {df["State"].nunique()}')
print()
print('Sample of cleaned data (rows 100-115):')
print(df.iloc[100:115].to_string())
print()
print('Samples from different states:')
for state in df['State'].unique()[:3]:
    print(f'\n{state}:')
    print(df[df['State'] == state].head(3).to_string())
