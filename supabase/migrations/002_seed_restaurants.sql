-- Seed restaurants data
INSERT INTO restaurants (name, location, distance_estimate_m, slug) VALUES
('Fiesta Food Court', 'Near Gate-2', 500, 'fiesta'),
('Magna Food Court', 'Inside GEC-2', 300, 'magna'),
('Enroute Food Court', 'Near Academic Block', 600, 'enroute'),
('Oasis Food Court', 'Near Hostels', 800, 'oasis'),
('Multiplex Food Court', 'Near Recreation Center', 400, 'multiplex'),
('Gazebo Food Court', 'Near ECC', 700, 'gazebo'),
('Maitri Food Court', 'Near Hostels', 900, 'maitri'),
('Arena Food Court', 'Near Multiplex', 750, 'arena'),
('Amoeba Food Court', 'Near GEC-2', 650, 'amoeba'),
('Floating Restaurant', 'Premium Area', 1000, 'floating')
ON CONFLICT (slug) DO NOTHING;

-- Verify data
SELECT COUNT(*) as restaurant_count FROM restaurants;
