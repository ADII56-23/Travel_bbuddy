import pandas as pd
import random
import os

# Ensure the data directory exists
if not os.path.exists('data'):
    os.makedirs('data')

# Configuration
NUM_ROWS = 15000
FILE_PATH = 'data/travel_packages.csv'

# ===== Destinations with region-specific activities =====
destinations = {
    # Indian destinations
    'Goa':          ['beach parties', 'water sports', 'seafood tasting', 'church visits', 'sunset cruises', 'flea markets'],
    'Manali':       ['mountain trekking', 'skiing', 'paragliding', 'river rafting', 'hot springs', 'temple visits'],
    'Jaipur':       ['fort tours', 'camel rides', 'bazaar shopping', 'palace visits', 'block printing workshops', 'cultural shows'],
    'Kerala':       ['houseboat cruises', 'ayurveda spa', 'tea plantation tours', 'backwater kayaking', 'kathakali shows', 'spice garden walks'],
    'Ladakh':       ['mountain biking', 'monastery visits', 'camping under stars', 'pangong lake tours', 'yak safaris', 'high altitude trekking'],
    'Varanasi':     ['ganga aarti', 'boat rides', 'temple tours', 'silk weaving tours', 'street food walks', 'yoga sessions'],
    'Andaman':      ['scuba diving', 'snorkeling', 'island hopping', 'glass bottom boat rides', 'mangrove kayaking', 'beach camping'],
    'Rishikesh':    ['river rafting', 'bungee jumping', 'yoga retreats', 'cliff jumping', 'camping by ganges', 'meditation sessions'],
    'Udaipur':      ['lake palace tours', 'boat rides', 'heritage walks', 'puppet shows', 'vintage car rides', 'rooftop dining'],
    'Shimla':       ['mall road shopping', 'toy train rides', 'nature walks', 'ice skating', 'colonial architecture tours', 'apple orchard visits'],
    # International destinations
    'Japan':        ['sushi tasting', 'temple tours', 'cherry blossom viewing', 'bullet train rides', 'tea ceremonies', 'anime district tours'],
    'Switzerland':  ['mountain hiking', 'skiing', 'chocolate factory tours', 'lake cruises', 'paragliding', 'scenic train rides'],
    'Hawaii':       ['beach surfing', 'volcano tours', 'snorkeling', 'luau feasts', 'whale watching', 'helicopter tours'],
    'France':       ['wine tasting', 'museum tours', 'eiffel tower visits', 'cheese tasting', 'river cruises', 'lavender field tours'],
    'Kenya':        ['wildlife safari', 'hot air balloon rides', 'tribal village visits', 'mountain climbing', 'beach relaxation', 'bird watching'],
    'Italy':        ['pasta making classes', 'colosseum tours', 'gondola rides', 'wine vineyard visits', 'fashion district shopping', 'gelato tasting'],
    'Iceland':      ['northern lights viewing', 'glacier hiking', 'hot spring bathing', 'whale watching', 'volcano tours', 'ice cave exploring'],
    'Thailand':     ['temple visits', 'street food tours', 'island hopping', 'elephant sanctuaries', 'floating markets', 'muay thai shows'],
    'Australia':    ['great barrier reef diving', 'kangaroo spotting', 'opera house tours', 'outback adventures', 'surfing lessons', 'koala sanctuaries'],
    'Brazil':       ['carnival celebrations', 'samba dancing', 'rainforest treks', 'copacabana beach', 'christ the redeemer visits', 'football matches'],
    'Turkey':       ['hot air balloon rides', 'mosque tours', 'bazaar shopping', 'turkish bath', 'blue voyage cruises', 'carpet weaving workshops'],
    'Bali':         ['temple visits', 'rice terrace treks', 'surfing lessons', 'yoga retreats', 'monkey forest tours', 'scuba diving'],
    'Bhutan':       ['monastery treks', 'dzong visits', 'archery matches', 'himalayan viewing', 'festival dances', 'mountain pass tours'],
}

styles = ['Luxury', 'Budget', 'Family-friendly', 'Adventurous', 'Modern', 'Romantic', 'Scenic', 'Relaxing', 'Premium', 'Backpacker', 'Cultural', 'Heritage']

data = []

for i in range(NUM_ROWS):
    dest = random.choice(list(destinations.keys()))
    style = random.choice(styles)
    acts = random.sample(destinations[dest], min(3, len(destinations[dest])))

    package_name = f"{style} {dest} Package {i+1}"
    duration = random.randint(3, 14)

    # Indian destinations have lower price ranges (₹15K - ₹200K)
    # International destinations have higher ranges (₹50K - ₹500K)
    indian_places = ['Goa', 'Manali', 'Jaipur', 'Kerala', 'Ladakh', 'Varanasi', 'Andaman', 'Rishikesh', 'Udaipur', 'Shimla']
    if dest in indian_places:
        price = random.randint(15000, 200000)
    else:
        price = random.randint(50000, 500000)

    description = f"Experience a {style.lower()} {duration}-day trip to {dest}. This package includes {', '.join(acts[:-1])} and {acts[-1]}."

    data.append([package_name, dest, duration, price, description])

# Create the CSV
df = pd.DataFrame(data, columns=['Package Name', 'Destination', 'Duration', 'Price', 'Package Description'])
df.to_csv(FILE_PATH, index=False)

print(f"Successfully generated {NUM_ROWS} rows in {FILE_PATH}!")
print(f"Destinations: {sorted(destinations.keys())}")
print(f"Indian: {len(indian_places)} | International: {len(destinations) - len(indian_places)}")