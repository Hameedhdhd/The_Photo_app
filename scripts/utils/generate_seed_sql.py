import csv

sql_statements = []

# Table creation and policy (already in migration, but good to have in one go if needed)
# For this script, we'll just generate the INSERT statements.

with open('data/categories/marketplace_categories.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        parent_id = row['parent_id'] if row['parent_id'] else 'NULL'
        label_de = row['label_de'].replace("'", "''")
        label = row['label'].replace("'", "''")
        
        sql = f"INSERT INTO categories (id, slug, label, label_de, icon, parent_id, sort_order) " \
              f"VALUES ({row['id']}, '{row['slug']}', '{label}', '{label_de}', '{row['icon']}', {parent_id}, {row['sort_order']}) " \
              f"ON CONFLICT (id) DO UPDATE SET " \
              f"slug = EXCLUDED.slug, label = EXCLUDED.label, label_de = EXCLUDED.label_de, " \
              f"icon = EXCLUDED.icon, parent_id = EXCLUDED.parent_id, sort_order = EXCLUDED.sort_order;"
        sql_statements.append(sql)

with open('supabase/seed_categories.sql', 'w', encoding='utf-8') as f:
    f.write("-- Seed categories data\n")
    f.write("\n".join(sql_statements))

print("Seed SQL created successfully.")
