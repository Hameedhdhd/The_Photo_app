import csv

categories = [
    # id, slug, label, label_de, icon, parent_id, sort_order
    (1, 'electronics', 'Electronics', 'Elektronik', 'phone-portrait-outline', None, 1),
    (2, 'fashion', 'Fashion', 'Mode', 'shirt-outline', None, 2),
    (3, 'home-garden', 'Home & Garden', 'Haus & Garten', 'home-outline', None, 3),
    (4, 'sports-outdoors', 'Sports & Outdoors', 'Sport & Freizeit', 'bicycle-outline', None, 4),
    (5, 'vehicles', 'Vehicles', 'Fahrzeuge', 'car-outline', None, 5),
    (6, 'books-media', 'Books & Media', 'Bücher & Medien', 'book-outline', None, 6),
    (7, 'toys-kids', 'Toys & Kids', 'Spielzeug & Kinder', 'happy-outline', None, 7),
    (8, 'health-beauty', 'Health & Beauty', 'Gesundheit & Schönheit', 'heart-outline', None, 8),
    (9, 'food-drinks', 'Food & Drinks', 'Essen & Trinken', 'restaurant-outline', None, 9),
    (10, 'tools-diy', 'Tools & DIY', 'Baumarkt & Garten', 'hammer-outline', None, 10),
    (11, 'music-instruments', 'Music & Instruments', 'Musikinstrumente', 'musical-notes-outline', None, 11),
    (12, 'art-crafts', 'Art & Crafts', 'Kunst & Handwerk', 'color-palette-outline', None, 12),
    (13, 'pet-supplies', 'Pet Supplies', 'Haustierbedarf', 'paw-outline', None, 13),
    (14, 'office-business', 'Office & Business', 'Büro & Gewerbe', 'briefcase-outline', None, 14),
    (15, 'collectibles', 'Collectibles', 'Sammeln & Seltenes', 'diamond-outline', None, 15),
    (16, 'jewelry-watches', 'Jewelry & Watches', 'Schmuck & Uhren', 'watch-outline', None, 16),
    (17, 'baby-maternity', 'Baby & Maternity', 'Baby & Mutter', 'rose-outline', None, 17),
    (18, 'travel-luggage', 'Travel & Luggage', 'Reise & Koffer', 'airplane-outline', None, 18),
    (19, 'services', 'Services', 'Dienstleistungen', 'construct-outline', None, 19),
    (20, 'other', 'Other', 'Sonstiges', 'apps-outline', None, 20),
    
    # Subcategories for Electronics (1)
    (21, 'phones', 'Phones', 'Handys', 'phone-portrait-outline', 1, 1),
    (22, 'laptops', 'Laptops', 'Laptops', 'laptop-outline', 1, 2),
    (23, 'tvs', 'TVs', 'Fernseher', 'tv-outline', 1, 3),
    (24, 'gaming', 'Gaming', 'Gaming', 'game-controller-outline', 1, 4),
    (25, 'cameras', 'Cameras', 'Kameras', 'camera-outline', 1, 5),
    (26, 'audio', 'Audio', 'Audio', 'headset-outline', 1, 6),
    (27, 'tablets', 'Tablets', 'Tablets', 'tablet-portrait-outline', 1, 7),
    
    # Subcategories for Fashion (2)
    (28, 'mens-clothing', 'Men\'s Clothing', 'Herrenbekleidung', 'shirt-outline', 2, 1),
    (29, 'womens-clothing', 'Women\'s Clothing', 'Damenbekleidung', 'woman-outline', 2, 2),
    (30, 'shoes', 'Shoes', 'Schuhe', 'footsteps-outline', 2, 3),
    (31, 'bags', 'Bags', 'Taschen', 'bag-handle-outline', 2, 4),
    (32, 'fashion-accessories', 'Accessories', 'Accessoires', 'watch-outline', 2, 5),
    (33, 'kids-fashion', 'Kids\' Fashion', 'Kindermode', 'happy-outline', 2, 6),
    
    # Subcategories for Home & Garden (3)
    (34, 'furniture', 'Furniture', 'Möbel', 'bed-outline', 3, 1),
    (35, 'kitchen', 'Kitchen', 'Küche', 'cafe-outline', 3, 2),
    (36, 'decor', 'Decor', 'Dekoration', 'color-wand-outline', 3, 3),
    (37, 'garden', 'Garden', 'Garten', 'leaf-outline', 3, 4),
    (38, 'lighting', 'Lighting', 'Beleuchtung', 'bulb-outline', 3, 5),
    (39, 'bedding', 'Bedding', 'Bettwäsche', 'bed-outline', 3, 6),
    
    # Subcategories for Sports & Outdoors (4)
    (40, 'fitness', 'Fitness', 'Fitness', 'barbell-outline', 4, 1),
    (41, 'cycling', 'Cycling', 'Radsport', 'bicycle-outline', 4, 2),
    (42, 'camping', 'Camping', 'Camping', 'bonfire-outline', 4, 3),
    (43, 'water-sports', 'Water Sports', 'Wassersport', 'water-outline', 4, 4),
    (44, 'team-sports', 'Team Sports', 'Teamsport', 'football-outline', 4, 5),
    
    # Subcategories for Vehicles (5)
    (45, 'cars', 'Cars', 'Autos', 'car-outline', 5, 1),
    (46, 'motorcycles', 'Motorcycles', 'Motorräder', 'bicycle-outline', 5, 2),
    (47, 'bikes', 'Bikes', 'Fahrräder', 'bicycle-outline', 5, 3),
    (48, 'vehicle-parts', 'Parts & Accessories', 'Teile & Zubehör', 'settings-outline', 5, 4),
    
    # Subcategories for Books & Media (6)
    (49, 'books', 'Books', 'Bücher', 'book-outline', 6, 1),
    (50, 'music', 'Music', 'Musik', 'musical-notes-outline', 6, 2),
    (51, 'movies', 'Movies', 'Filme', 'film-outline', 6, 3),
    (52, 'video-games', 'Video Games', 'Videospiele', 'game-controller-outline', 6, 4),
    
    # Subcategories for Toys & Kids (7)
    (53, 'toys', 'Toys', 'Spielzeug', 'happy-outline', 7, 1),
    (54, 'baby-gear', 'Baby Gear', 'Babyausstattung', 'rose-outline', 7, 2),
    (55, 'kids-clothing', 'Kids Clothing', 'Kinderbekleidung', 'shirt-outline', 7, 3),
    (56, 'educational', 'Educational', 'Lernspielzeug', 'school-outline', 7, 4),
    
    # Subcategories for Health & Beauty (8)
    (57, 'skincare', 'Skincare', 'Hautpflege', 'heart-outline', 8, 1),
    (58, 'haircare', 'Haircare', 'Haarpflege', 'cut-outline', 8, 2),
    (59, 'medical', 'Medical', 'Medizin', 'medkit-outline', 8, 3),
    (60, 'perfume', 'Perfume', 'Parfüm', 'color-wand-outline', 8, 4),
    
    # Subcategories for Food & Drinks (9)
    (61, 'fresh-food', 'Fresh Food', 'Frische Lebensmittel', 'restaurant-outline', 9, 1),
    (62, 'packaged-food', 'Packaged Food', 'Verpackte Lebensmittel', 'fast-food-outline', 9, 2),
    (63, 'beverages', 'Beverages', 'Getränke', 'wine-outline', 9, 3),
    (64, 'organic', 'Organic', 'Bio', 'leaf-outline', 9, 4),
    
    # Subcategories for Tools & DIY (10)
    (65, 'power-tools', 'Power Tools', 'Elektrowerkzeuge', 'hammer-outline', 10, 1),
    (66, 'hand-tools', 'Hand Tools', 'Handwerkzeuge', 'build-outline', 10, 2),
    (67, 'hardware', 'Hardware', 'Eisenwaren', 'construct-outline', 10, 3),
    (68, 'paint-diy', 'Paint & DIY', 'Farbe & DIY', 'brush-outline', 10, 4),
    
    # Subcategories for Music & Instruments (11)
    (69, 'guitars', 'Guitars', 'Gitarren', 'musical-note-outline', 11, 1),
    (70, 'keyboards', 'Keyboards', 'Keyboards', 'musical-notes-outline', 11, 2),
    (71, 'dj-gear', 'DJ Gear', 'DJ-Equipment', 'disc-outline', 11, 3),
    (72, 'music-accessories', 'Music Accessories', 'Zubehör', 'mic-outline', 11, 4),
    
    # Subcategories for Art & Crafts (12)
    (73, 'painting-supplies', 'Painting', 'Malen', 'color-palette-outline', 12, 1),
    (74, 'sewing-supplies', 'Sewing', 'Nähen', 'cut-outline', 12, 2),
    (75, 'craft-kits', 'Craft Kits', 'Bastelsets', 'gift-outline', 12, 3),
    (76, 'art-supplies', 'Art Supplies', 'Künstlerbedarf', 'brush-outline', 12, 4),
    
    # Subcategories for Pet Supplies (13)
    (77, 'dog-supplies', 'Dogs', 'Hunde', 'paw-outline', 13, 1),
    (78, 'cat-supplies', 'Cats', 'Katzen', 'paw-outline', 13, 2),
    (79, 'bird-supplies', 'Birds', 'Vögel', 'paw-outline', 13, 3),
    (80, 'fish-supplies', 'Fish', 'Fische', 'water-outline', 13, 4),
    
    # Subcategories for Office & Business (14)
    (81, 'stationery', 'Stationery', 'Schreibwaren', 'pencil-outline', 14, 1),
    (82, 'printers', 'Printers', 'Drucker', 'print-outline', 14, 2),
    (83, 'office-furniture', 'Office Furniture', 'Büromöbel', 'briefcase-outline', 14, 3),
    (84, 'business-tech', 'Business Tech', 'Gewerbetechnik', 'desktop-outline', 14, 4),
    
    # Subcategories for Collectibles (15)
    (85, 'antiques', 'Antiques', 'Antiquitäten', 'diamond-outline', 15, 1),
    (86, 'coins-stamps', 'Coins & Stamps', 'Münzen & Briefmarken', 'cash-outline', 15, 2),
    (87, 'memorabilia', 'Memorabilia', 'Fanartikel', 'medal-outline', 15, 3),
    (88, 'rare-items', 'Rare Items', 'Seltene Funde', 'star-outline', 15, 4),
    
    # Subcategories for Jewelry & Watches (16)
    (89, 'rings-jewelry', 'Rings', 'Ringe', 'diamond-outline', 16, 1),
    (90, 'necklaces', 'Necklaces', 'Halsketten', 'color-palette-outline', 16, 2),
    (91, 'watches-jewelry', 'Watches', 'Uhren', 'watch-outline', 16, 3),
    (92, 'bracelets', 'Bracelets', 'Armbänder', 'infinite-outline', 16, 4),
    
    # Subcategories for Baby & Maternity (17)
    (93, 'strollers', 'Strollers', 'Kinderwagen', 'navigate-outline', 17, 1),
    (94, 'feeding', 'Feeding', 'Essen & Trinken', 'cafe-outline', 17, 2),
    (95, 'baby-clothing', 'Baby Clothing', 'Babykleidung', 'shirt-outline', 17, 3),
    (96, 'nursery', 'Nursery', 'Kinderzimmer', 'home-outline', 17, 4),
    
    # Subcategories for Travel & Luggage (18)
    (97, 'travel-bags', 'Bags', 'Reisetaschen', 'bag-outline', 18, 1),
    (98, 'luggage-accessories', 'Travel Accessories', 'Zubehör', 'briefcase-outline', 18, 2),
    (99, 'suitcases', 'Suitcases', 'Koffer', 'airplane-outline', 18, 3),
    
    # Subcategories for Services (19)
    (100, 'repairs', 'Repairs', 'Reparaturen', 'construct-outline', 19, 1),
    (101, 'lessons', 'Lessons', 'Unterricht', 'school-outline', 19, 2),
    (102, 'cleaning-services', 'Cleaning', 'Reinigung', 'water-outline', 19, 3),
    (103, 'delivery-services', 'Delivery', 'Lieferung', 'car-outline', 19, 4),
]

with open('data/categories/marketplace_categories.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['id', 'slug', 'label', 'label_de', 'icon', 'parent_id', 'sort_order'])
    writer.writerows(categories)

print(f"CSV expanded successfully with {len(categories)} categories.")
