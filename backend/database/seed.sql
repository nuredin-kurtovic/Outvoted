-- Seed data for Outvoted game
-- Updated for 5-ideology x 4-ethnicity (20 groups) per region system

USE outvoted;

-- Disable foreign key checks for seeding
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- CANDIDATES TABLE
-- ============================================================

-- Create candidates table if not exists (with new ideology enum)
CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ethnicity ENUM('Bosniak', 'Croat', 'Serb', 'Other') NOT NULL,
    ideology ENUM(
        'Socialist Nationalist', 
        'Liberal Reformist', 
        'Nationalist Conservative', 
        'Civic Unitary', 
        'Populist Anti-System'
    ) NOT NULL,
    home_region_id INT NOT NULL,
    description TEXT,
    image_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing data (for re-seeding)
DELETE FROM candidate_region_coefficients;
DELETE FROM region_demographics;
DELETE FROM candidates;
DELETE FROM regions;
DELETE FROM actions;

-- ============================================================
-- REGIONS - 18 Bosnia and Herzegovina regions
-- ============================================================

INSERT INTO regions (id, name, code, population, bosniak_pop, croat_pop, serb_pop, other_pop, administrative_importance) VALUES
-- Federation of Bosnia and Herzegovina (FBiH) - 10 Cantons
(1, 'Una-Sana Canton', 'UNA_SANA', 273000, 245000, 10000, 12000, 6000, 'FBiH'),
(2, 'Posavina Canton', 'POSAVINA', 43000, 14000, 27000, 1000, 1000, 'FBiH'),
(3, 'Tuzla Canton', 'TUZLA', 445000, 390000, 25000, 15000, 15000, 'FBiH'),
(4, 'Zenica-Doboj Canton', 'ZENICA_DOBOJ', 364000, 300000, 55000, 5000, 4000, 'FBiH'),
(5, 'Bosnian-Podrinje', 'BOSNIAN_PODRINJE', 23000, 21000, 500, 1000, 500, 'FBiH'),
(6, 'Central Bosnia Canton', 'CENTRAL_BOSNIA', 254000, 148000, 92000, 5000, 9000, 'FBiH'),
(7, 'Herzegovina-Neretva Canton', 'HERZEGOVINA_NERETVA', 224000, 110000, 105000, 3000, 6000, 'FBiH'),
(8, 'West Herzegovina Canton', 'WEST_HERZEGOVINA', 94000, 1000, 92000, 0, 1000, 'FBiH'),
(9, 'Sarajevo Canton', 'SARAJEVO', 413000, 350000, 17000, 20000, 26000, 'FBiH'),
(10, 'Canton 10 (Herzeg-Bosnia)', 'CANTON_10', 84000, 17000, 65000, 1000, 1000, 'FBiH'),

-- Republika Srpska (RS) - 7 regions
(11, 'Banja Luka Core', 'BANJA_LUKA', 250000, 20000, 5000, 220000, 5000, 'RS'),
(12, 'Krajina West', 'KRAJINA_WEST', 180000, 15000, 5000, 155000, 5000, 'RS'),
(13, 'Doboj', 'DOBOJ', 150000, 35000, 5000, 105000, 5000, 'RS'),
(14, 'Bijeljina', 'BIJELJINA', 115000, 10000, 5000, 95000, 5000, 'RS'),
(15, 'Podrinje', 'PODRINJE', 85000, 25000, 2000, 55000, 3000, 'RS'),
(16, 'Romanija', 'ROMANIJA', 95000, 5000, 2000, 85000, 3000, 'RS'),
(17, 'Eastern Herzegovina', 'EAST_HERZEGOVINA', 90000, 3000, 5000, 80000, 2000, 'RS'),

-- District
(18, 'Brcko District', 'BRCKO', 84000, 35000, 17000, 29000, 3000, 'District');

-- ============================================================
-- CANDIDATES - Updated with new ideology system
-- ============================================================

INSERT INTO candidates (id, name, ethnicity, ideology, home_region_id, description, image_url) VALUES
-- Bosniaks (Green background)
(1, 'Bakir Izetbegovic', 'Bosniak', 'Nationalist Conservative', 9, 'Former chairman of the Presidency of BiH, leader of SDA. Strong advocate for Bosniak interests and territorial integrity.', 'https://upload.wikimedia.org/wikipedia/commons/5/56/Izetbegovi%C4%87%2C_Bakir.jpg'),
(2, 'Denis Becirovic', 'Bosniak', 'Socialist Nationalist', 3, 'Current Bosniak member of the Presidency. Social democrat from Tuzla, promotes civic values and workers rights.', 'https://ui-avatars.com/api/?name=Denis+Becirovic&size=400&background=22c55e&color=fff&bold=true&format=png'),
(3, 'Ramo Isak', 'Bosniak', 'Liberal Reformist', 9, 'Minister of Security of BiH. Technocrat focused on EU integration and institutional reform.', 'https://ui-avatars.com/api/?name=Ramo+Isak&size=400&background=22c55e&color=fff&bold=true&format=png'),
(4, 'Halid Genjac', 'Bosniak', 'Nationalist Conservative', 6, 'Veteran SDA politician from Central Bosnia. Traditional conservative with strong rural support.', 'https://ui-avatars.com/api/?name=Halid+Genjac&size=400&background=22c55e&color=fff&bold=true&format=png'),

-- Serbs (Blue background)
(5, 'Milorad Dodik', 'Serb', 'Nationalist Conservative', 11, 'President of Republika Srpska, SNSD leader. Controversial figure advocating for RS autonomy.', 'https://ui-avatars.com/api/?name=Milorad+Dodik&size=400&background=3b82f6&color=fff&bold=true&format=png'),
(6, 'Zeljka Cvijanovic', 'Serb', 'Nationalist Conservative', 11, 'Former President of RS. Close ally of Dodik, represents SNSD establishment.', 'https://ui-avatars.com/api/?name=Zeljka+Cvijanovic&size=400&background=3b82f6&color=fff&bold=true&format=png'),
(7, 'Stasa Kosarac', 'Serb', 'Populist Anti-System', 17, 'SNSD politician from Eastern RS. Known for strong nationalist rhetoric.', 'https://ui-avatars.com/api/?name=Stasa+Kosarac&size=400&background=3b82f6&color=fff&bold=true&format=png'),
(8, 'Drasko Stanivukovic', 'Serb', 'Liberal Reformist', 11, 'Young Mayor of Banja Luka from PDP. Reformist challenging SNSD dominance, popular with youth.', 'https://ui-avatars.com/api/?name=Drasko+Stanivukovic&size=400&background=3b82f6&color=fff&bold=true&format=png'),

-- Croats (Red background)
(9, 'Dragan Covic', 'Croat', 'Nationalist Conservative', 7, 'HDZ BiH leader, former member of Presidency. Advocates for Croat entity and electoral reform.', 'https://ui-avatars.com/api/?name=Dragan+Covic&size=400&background=ef4444&color=fff&bold=true&format=png'),
(10, 'Zeljko Komsic', 'Croat', 'Civic Unitary', 9, 'Current Croat member of Presidency. Civic-oriented, controversially elected mainly by Bosniak votes.', 'https://ui-avatars.com/api/?name=Zeljko+Komsic&size=400&background=ef4444&color=fff&bold=true&format=png'),
(11, 'Martin Raguz', 'Croat', 'Nationalist Conservative', 7, 'HDZ politician from Herzegovina-Neretva. Traditional conservative representing southern Croats.', 'https://ui-avatars.com/api/?name=Martin+Raguz&size=400&background=ef4444&color=fff&bold=true&format=png'),
(12, 'Dijana Zelenika', 'Croat', 'Nationalist Conservative', 8, 'HDZ 1990 politician from West Herzegovina. Hardline conservative on Croat national issues.', 'https://ui-avatars.com/api/?name=Dijana+Zelenika&size=400&background=ef4444&color=fff&bold=true&format=png');

-- ============================================================
-- REGION DEMOGRAPHICS - 20 groups per region (5 ideologies x 4 ethnicities)
-- Population distributed proportionally based on ethnic shares and estimated ideology distribution
-- ============================================================

-- Helper: For each region, distribute each ethnic population across 5 ideologies
-- Default ideology distribution: SocNat 20%, LibRef 15%, NatCons 35%, CivUni 15%, PopAnti 15%

-- Region 1: Una-Sana Canton (273000 total: 245000 Bosniak, 10000 Croat, 12000 Serb, 6000 Other)
INSERT INTO region_demographics (region_id, ideology, ethnicity, population) VALUES
(1, 'Socialist Nationalist', 'Bosniak', 49000),
(1, 'Liberal Reformist', 'Bosniak', 36750),
(1, 'Nationalist Conservative', 'Bosniak', 85750),
(1, 'Civic Unitary', 'Bosniak', 36750),
(1, 'Populist Anti-System', 'Bosniak', 36750),
(1, 'Socialist Nationalist', 'Croat', 2000),
(1, 'Liberal Reformist', 'Croat', 1500),
(1, 'Nationalist Conservative', 'Croat', 3500),
(1, 'Civic Unitary', 'Croat', 1500),
(1, 'Populist Anti-System', 'Croat', 1500),
(1, 'Socialist Nationalist', 'Serb', 2400),
(1, 'Liberal Reformist', 'Serb', 1800),
(1, 'Nationalist Conservative', 'Serb', 4200),
(1, 'Civic Unitary', 'Serb', 1800),
(1, 'Populist Anti-System', 'Serb', 1800),
(1, 'Socialist Nationalist', 'Other', 1200),
(1, 'Liberal Reformist', 'Other', 900),
(1, 'Nationalist Conservative', 'Other', 2100),
(1, 'Civic Unitary', 'Other', 900),
(1, 'Populist Anti-System', 'Other', 900),

-- Region 2: Posavina Canton (43000 total: 14000 Bosniak, 27000 Croat, 1000 Serb, 1000 Other)
(2, 'Socialist Nationalist', 'Bosniak', 2800),
(2, 'Liberal Reformist', 'Bosniak', 2100),
(2, 'Nationalist Conservative', 'Bosniak', 4900),
(2, 'Civic Unitary', 'Bosniak', 2100),
(2, 'Populist Anti-System', 'Bosniak', 2100),
(2, 'Socialist Nationalist', 'Croat', 5400),
(2, 'Liberal Reformist', 'Croat', 4050),
(2, 'Nationalist Conservative', 'Croat', 9450),
(2, 'Civic Unitary', 'Croat', 4050),
(2, 'Populist Anti-System', 'Croat', 4050),
(2, 'Socialist Nationalist', 'Serb', 200),
(2, 'Liberal Reformist', 'Serb', 150),
(2, 'Nationalist Conservative', 'Serb', 350),
(2, 'Civic Unitary', 'Serb', 150),
(2, 'Populist Anti-System', 'Serb', 150),
(2, 'Socialist Nationalist', 'Other', 200),
(2, 'Liberal Reformist', 'Other', 150),
(2, 'Nationalist Conservative', 'Other', 350),
(2, 'Civic Unitary', 'Other', 150),
(2, 'Populist Anti-System', 'Other', 150),

-- Region 3: Tuzla Canton (445000 total: 390000 Bosniak, 25000 Croat, 15000 Serb, 15000 Other)
(3, 'Socialist Nationalist', 'Bosniak', 78000),
(3, 'Liberal Reformist', 'Bosniak', 58500),
(3, 'Nationalist Conservative', 'Bosniak', 136500),
(3, 'Civic Unitary', 'Bosniak', 58500),
(3, 'Populist Anti-System', 'Bosniak', 58500),
(3, 'Socialist Nationalist', 'Croat', 5000),
(3, 'Liberal Reformist', 'Croat', 3750),
(3, 'Nationalist Conservative', 'Croat', 8750),
(3, 'Civic Unitary', 'Croat', 3750),
(3, 'Populist Anti-System', 'Croat', 3750),
(3, 'Socialist Nationalist', 'Serb', 3000),
(3, 'Liberal Reformist', 'Serb', 2250),
(3, 'Nationalist Conservative', 'Serb', 5250),
(3, 'Civic Unitary', 'Serb', 2250),
(3, 'Populist Anti-System', 'Serb', 2250),
(3, 'Socialist Nationalist', 'Other', 3000),
(3, 'Liberal Reformist', 'Other', 2250),
(3, 'Nationalist Conservative', 'Other', 5250),
(3, 'Civic Unitary', 'Other', 2250),
(3, 'Populist Anti-System', 'Other', 2250),

-- Region 4: Zenica-Doboj Canton (364000 total: 300000 Bosniak, 55000 Croat, 5000 Serb, 4000 Other)
(4, 'Socialist Nationalist', 'Bosniak', 60000),
(4, 'Liberal Reformist', 'Bosniak', 45000),
(4, 'Nationalist Conservative', 'Bosniak', 105000),
(4, 'Civic Unitary', 'Bosniak', 45000),
(4, 'Populist Anti-System', 'Bosniak', 45000),
(4, 'Socialist Nationalist', 'Croat', 11000),
(4, 'Liberal Reformist', 'Croat', 8250),
(4, 'Nationalist Conservative', 'Croat', 19250),
(4, 'Civic Unitary', 'Croat', 8250),
(4, 'Populist Anti-System', 'Croat', 8250),
(4, 'Socialist Nationalist', 'Serb', 1000),
(4, 'Liberal Reformist', 'Serb', 750),
(4, 'Nationalist Conservative', 'Serb', 1750),
(4, 'Civic Unitary', 'Serb', 750),
(4, 'Populist Anti-System', 'Serb', 750),
(4, 'Socialist Nationalist', 'Other', 800),
(4, 'Liberal Reformist', 'Other', 600),
(4, 'Nationalist Conservative', 'Other', 1400),
(4, 'Civic Unitary', 'Other', 600),
(4, 'Populist Anti-System', 'Other', 600),

-- Region 5: Bosnian-Podrinje (23000 total: 21000 Bosniak, 500 Croat, 1000 Serb, 500 Other)
(5, 'Socialist Nationalist', 'Bosniak', 4200),
(5, 'Liberal Reformist', 'Bosniak', 3150),
(5, 'Nationalist Conservative', 'Bosniak', 7350),
(5, 'Civic Unitary', 'Bosniak', 3150),
(5, 'Populist Anti-System', 'Bosniak', 3150),
(5, 'Socialist Nationalist', 'Croat', 100),
(5, 'Liberal Reformist', 'Croat', 75),
(5, 'Nationalist Conservative', 'Croat', 175),
(5, 'Civic Unitary', 'Croat', 75),
(5, 'Populist Anti-System', 'Croat', 75),
(5, 'Socialist Nationalist', 'Serb', 200),
(5, 'Liberal Reformist', 'Serb', 150),
(5, 'Nationalist Conservative', 'Serb', 350),
(5, 'Civic Unitary', 'Serb', 150),
(5, 'Populist Anti-System', 'Serb', 150),
(5, 'Socialist Nationalist', 'Other', 100),
(5, 'Liberal Reformist', 'Other', 75),
(5, 'Nationalist Conservative', 'Other', 175),
(5, 'Civic Unitary', 'Other', 75),
(5, 'Populist Anti-System', 'Other', 75),

-- Region 6: Central Bosnia Canton (254000 total: 148000 Bosniak, 92000 Croat, 5000 Serb, 9000 Other)
(6, 'Socialist Nationalist', 'Bosniak', 29600),
(6, 'Liberal Reformist', 'Bosniak', 22200),
(6, 'Nationalist Conservative', 'Bosniak', 51800),
(6, 'Civic Unitary', 'Bosniak', 22200),
(6, 'Populist Anti-System', 'Bosniak', 22200),
(6, 'Socialist Nationalist', 'Croat', 18400),
(6, 'Liberal Reformist', 'Croat', 13800),
(6, 'Nationalist Conservative', 'Croat', 32200),
(6, 'Civic Unitary', 'Croat', 13800),
(6, 'Populist Anti-System', 'Croat', 13800),
(6, 'Socialist Nationalist', 'Serb', 1000),
(6, 'Liberal Reformist', 'Serb', 750),
(6, 'Nationalist Conservative', 'Serb', 1750),
(6, 'Civic Unitary', 'Serb', 750),
(6, 'Populist Anti-System', 'Serb', 750),
(6, 'Socialist Nationalist', 'Other', 1800),
(6, 'Liberal Reformist', 'Other', 1350),
(6, 'Nationalist Conservative', 'Other', 3150),
(6, 'Civic Unitary', 'Other', 1350),
(6, 'Populist Anti-System', 'Other', 1350),

-- Region 7: Herzegovina-Neretva Canton (224000 total: 110000 Bosniak, 105000 Croat, 3000 Serb, 6000 Other)
(7, 'Socialist Nationalist', 'Bosniak', 22000),
(7, 'Liberal Reformist', 'Bosniak', 16500),
(7, 'Nationalist Conservative', 'Bosniak', 38500),
(7, 'Civic Unitary', 'Bosniak', 16500),
(7, 'Populist Anti-System', 'Bosniak', 16500),
(7, 'Socialist Nationalist', 'Croat', 21000),
(7, 'Liberal Reformist', 'Croat', 15750),
(7, 'Nationalist Conservative', 'Croat', 36750),
(7, 'Civic Unitary', 'Croat', 15750),
(7, 'Populist Anti-System', 'Croat', 15750),
(7, 'Socialist Nationalist', 'Serb', 600),
(7, 'Liberal Reformist', 'Serb', 450),
(7, 'Nationalist Conservative', 'Serb', 1050),
(7, 'Civic Unitary', 'Serb', 450),
(7, 'Populist Anti-System', 'Serb', 450),
(7, 'Socialist Nationalist', 'Other', 1200),
(7, 'Liberal Reformist', 'Other', 900),
(7, 'Nationalist Conservative', 'Other', 2100),
(7, 'Civic Unitary', 'Other', 900),
(7, 'Populist Anti-System', 'Other', 900),

-- Region 8: West Herzegovina Canton (94000 total: 1000 Bosniak, 92000 Croat, 0 Serb, 1000 Other)
(8, 'Socialist Nationalist', 'Bosniak', 200),
(8, 'Liberal Reformist', 'Bosniak', 150),
(8, 'Nationalist Conservative', 'Bosniak', 350),
(8, 'Civic Unitary', 'Bosniak', 150),
(8, 'Populist Anti-System', 'Bosniak', 150),
(8, 'Socialist Nationalist', 'Croat', 18400),
(8, 'Liberal Reformist', 'Croat', 13800),
(8, 'Nationalist Conservative', 'Croat', 32200),
(8, 'Civic Unitary', 'Croat', 13800),
(8, 'Populist Anti-System', 'Croat', 13800),
(8, 'Socialist Nationalist', 'Serb', 0),
(8, 'Liberal Reformist', 'Serb', 0),
(8, 'Nationalist Conservative', 'Serb', 0),
(8, 'Civic Unitary', 'Serb', 0),
(8, 'Populist Anti-System', 'Serb', 0),
(8, 'Socialist Nationalist', 'Other', 200),
(8, 'Liberal Reformist', 'Other', 150),
(8, 'Nationalist Conservative', 'Other', 350),
(8, 'Civic Unitary', 'Other', 150),
(8, 'Populist Anti-System', 'Other', 150),

-- Region 9: Sarajevo Canton (413000 total: 350000 Bosniak, 17000 Croat, 20000 Serb, 26000 Other)
-- More liberal/civic due to urban nature
(9, 'Socialist Nationalist', 'Bosniak', 52500),
(9, 'Liberal Reformist', 'Bosniak', 70000),
(9, 'Nationalist Conservative', 'Bosniak', 105000),
(9, 'Civic Unitary', 'Bosniak', 70000),
(9, 'Populist Anti-System', 'Bosniak', 52500),
(9, 'Socialist Nationalist', 'Croat', 2550),
(9, 'Liberal Reformist', 'Croat', 3400),
(9, 'Nationalist Conservative', 'Croat', 5100),
(9, 'Civic Unitary', 'Croat', 3400),
(9, 'Populist Anti-System', 'Croat', 2550),
(9, 'Socialist Nationalist', 'Serb', 3000),
(9, 'Liberal Reformist', 'Serb', 4000),
(9, 'Nationalist Conservative', 'Serb', 6000),
(9, 'Civic Unitary', 'Serb', 4000),
(9, 'Populist Anti-System', 'Serb', 3000),
(9, 'Socialist Nationalist', 'Other', 3900),
(9, 'Liberal Reformist', 'Other', 5200),
(9, 'Nationalist Conservative', 'Other', 7800),
(9, 'Civic Unitary', 'Other', 5200),
(9, 'Populist Anti-System', 'Other', 3900),

-- Region 10: Canton 10 Herzeg-Bosnia (84000 total: 17000 Bosniak, 65000 Croat, 1000 Serb, 1000 Other)
(10, 'Socialist Nationalist', 'Bosniak', 3400),
(10, 'Liberal Reformist', 'Bosniak', 2550),
(10, 'Nationalist Conservative', 'Bosniak', 5950),
(10, 'Civic Unitary', 'Bosniak', 2550),
(10, 'Populist Anti-System', 'Bosniak', 2550),
(10, 'Socialist Nationalist', 'Croat', 13000),
(10, 'Liberal Reformist', 'Croat', 9750),
(10, 'Nationalist Conservative', 'Croat', 22750),
(10, 'Civic Unitary', 'Croat', 9750),
(10, 'Populist Anti-System', 'Croat', 9750),
(10, 'Socialist Nationalist', 'Serb', 200),
(10, 'Liberal Reformist', 'Serb', 150),
(10, 'Nationalist Conservative', 'Serb', 350),
(10, 'Civic Unitary', 'Serb', 150),
(10, 'Populist Anti-System', 'Serb', 150),
(10, 'Socialist Nationalist', 'Other', 200),
(10, 'Liberal Reformist', 'Other', 150),
(10, 'Nationalist Conservative', 'Other', 350),
(10, 'Civic Unitary', 'Other', 150),
(10, 'Populist Anti-System', 'Other', 150),

-- Region 11: Banja Luka Core (250000 total: 20000 Bosniak, 5000 Croat, 220000 Serb, 5000 Other)
-- More liberal/reformist due to urban nature
(11, 'Socialist Nationalist', 'Bosniak', 4000),
(11, 'Liberal Reformist', 'Bosniak', 4000),
(11, 'Nationalist Conservative', 'Bosniak', 6000),
(11, 'Civic Unitary', 'Bosniak', 3000),
(11, 'Populist Anti-System', 'Bosniak', 3000),
(11, 'Socialist Nationalist', 'Croat', 1000),
(11, 'Liberal Reformist', 'Croat', 1000),
(11, 'Nationalist Conservative', 'Croat', 1500),
(11, 'Civic Unitary', 'Croat', 750),
(11, 'Populist Anti-System', 'Croat', 750),
(11, 'Socialist Nationalist', 'Serb', 33000),
(11, 'Liberal Reformist', 'Serb', 44000),
(11, 'Nationalist Conservative', 'Serb', 77000),
(11, 'Civic Unitary', 'Serb', 33000),
(11, 'Populist Anti-System', 'Serb', 33000),
(11, 'Socialist Nationalist', 'Other', 1000),
(11, 'Liberal Reformist', 'Other', 1000),
(11, 'Nationalist Conservative', 'Other', 1500),
(11, 'Civic Unitary', 'Other', 750),
(11, 'Populist Anti-System', 'Other', 750),

-- Region 12: Krajina West (180000 total: 15000 Bosniak, 5000 Croat, 155000 Serb, 5000 Other)
(12, 'Socialist Nationalist', 'Bosniak', 3000),
(12, 'Liberal Reformist', 'Bosniak', 2250),
(12, 'Nationalist Conservative', 'Bosniak', 5250),
(12, 'Civic Unitary', 'Bosniak', 2250),
(12, 'Populist Anti-System', 'Bosniak', 2250),
(12, 'Socialist Nationalist', 'Croat', 1000),
(12, 'Liberal Reformist', 'Croat', 750),
(12, 'Nationalist Conservative', 'Croat', 1750),
(12, 'Civic Unitary', 'Croat', 750),
(12, 'Populist Anti-System', 'Croat', 750),
(12, 'Socialist Nationalist', 'Serb', 31000),
(12, 'Liberal Reformist', 'Serb', 23250),
(12, 'Nationalist Conservative', 'Serb', 54250),
(12, 'Civic Unitary', 'Serb', 23250),
(12, 'Populist Anti-System', 'Serb', 23250),
(12, 'Socialist Nationalist', 'Other', 1000),
(12, 'Liberal Reformist', 'Other', 750),
(12, 'Nationalist Conservative', 'Other', 1750),
(12, 'Civic Unitary', 'Other', 750),
(12, 'Populist Anti-System', 'Other', 750),

-- Region 13: Doboj (150000 total: 35000 Bosniak, 5000 Croat, 105000 Serb, 5000 Other)
(13, 'Socialist Nationalist', 'Bosniak', 7000),
(13, 'Liberal Reformist', 'Bosniak', 5250),
(13, 'Nationalist Conservative', 'Bosniak', 12250),
(13, 'Civic Unitary', 'Bosniak', 5250),
(13, 'Populist Anti-System', 'Bosniak', 5250),
(13, 'Socialist Nationalist', 'Croat', 1000),
(13, 'Liberal Reformist', 'Croat', 750),
(13, 'Nationalist Conservative', 'Croat', 1750),
(13, 'Civic Unitary', 'Croat', 750),
(13, 'Populist Anti-System', 'Croat', 750),
(13, 'Socialist Nationalist', 'Serb', 21000),
(13, 'Liberal Reformist', 'Serb', 15750),
(13, 'Nationalist Conservative', 'Serb', 36750),
(13, 'Civic Unitary', 'Serb', 15750),
(13, 'Populist Anti-System', 'Serb', 15750),
(13, 'Socialist Nationalist', 'Other', 1000),
(13, 'Liberal Reformist', 'Other', 750),
(13, 'Nationalist Conservative', 'Other', 1750),
(13, 'Civic Unitary', 'Other', 750),
(13, 'Populist Anti-System', 'Other', 750),

-- Region 14: Bijeljina (115000 total: 10000 Bosniak, 5000 Croat, 95000 Serb, 5000 Other)
(14, 'Socialist Nationalist', 'Bosniak', 2000),
(14, 'Liberal Reformist', 'Bosniak', 1500),
(14, 'Nationalist Conservative', 'Bosniak', 3500),
(14, 'Civic Unitary', 'Bosniak', 1500),
(14, 'Populist Anti-System', 'Bosniak', 1500),
(14, 'Socialist Nationalist', 'Croat', 1000),
(14, 'Liberal Reformist', 'Croat', 750),
(14, 'Nationalist Conservative', 'Croat', 1750),
(14, 'Civic Unitary', 'Croat', 750),
(14, 'Populist Anti-System', 'Croat', 750),
(14, 'Socialist Nationalist', 'Serb', 19000),
(14, 'Liberal Reformist', 'Serb', 14250),
(14, 'Nationalist Conservative', 'Serb', 33250),
(14, 'Civic Unitary', 'Serb', 14250),
(14, 'Populist Anti-System', 'Serb', 14250),
(14, 'Socialist Nationalist', 'Other', 1000),
(14, 'Liberal Reformist', 'Other', 750),
(14, 'Nationalist Conservative', 'Other', 1750),
(14, 'Civic Unitary', 'Other', 750),
(14, 'Populist Anti-System', 'Other', 750),

-- Region 15: Podrinje (85000 total: 25000 Bosniak, 2000 Croat, 55000 Serb, 3000 Other)
(15, 'Socialist Nationalist', 'Bosniak', 5000),
(15, 'Liberal Reformist', 'Bosniak', 3750),
(15, 'Nationalist Conservative', 'Bosniak', 8750),
(15, 'Civic Unitary', 'Bosniak', 3750),
(15, 'Populist Anti-System', 'Bosniak', 3750),
(15, 'Socialist Nationalist', 'Croat', 400),
(15, 'Liberal Reformist', 'Croat', 300),
(15, 'Nationalist Conservative', 'Croat', 700),
(15, 'Civic Unitary', 'Croat', 300),
(15, 'Populist Anti-System', 'Croat', 300),
(15, 'Socialist Nationalist', 'Serb', 11000),
(15, 'Liberal Reformist', 'Serb', 8250),
(15, 'Nationalist Conservative', 'Serb', 19250),
(15, 'Civic Unitary', 'Serb', 8250),
(15, 'Populist Anti-System', 'Serb', 8250),
(15, 'Socialist Nationalist', 'Other', 600),
(15, 'Liberal Reformist', 'Other', 450),
(15, 'Nationalist Conservative', 'Other', 1050),
(15, 'Civic Unitary', 'Other', 450),
(15, 'Populist Anti-System', 'Other', 450),

-- Region 16: Romanija (95000 total: 5000 Bosniak, 2000 Croat, 85000 Serb, 3000 Other)
(16, 'Socialist Nationalist', 'Bosniak', 1000),
(16, 'Liberal Reformist', 'Bosniak', 750),
(16, 'Nationalist Conservative', 'Bosniak', 1750),
(16, 'Civic Unitary', 'Bosniak', 750),
(16, 'Populist Anti-System', 'Bosniak', 750),
(16, 'Socialist Nationalist', 'Croat', 400),
(16, 'Liberal Reformist', 'Croat', 300),
(16, 'Nationalist Conservative', 'Croat', 700),
(16, 'Civic Unitary', 'Croat', 300),
(16, 'Populist Anti-System', 'Croat', 300),
(16, 'Socialist Nationalist', 'Serb', 17000),
(16, 'Liberal Reformist', 'Serb', 12750),
(16, 'Nationalist Conservative', 'Serb', 29750),
(16, 'Civic Unitary', 'Serb', 12750),
(16, 'Populist Anti-System', 'Serb', 12750),
(16, 'Socialist Nationalist', 'Other', 600),
(16, 'Liberal Reformist', 'Other', 450),
(16, 'Nationalist Conservative', 'Other', 1050),
(16, 'Civic Unitary', 'Other', 450),
(16, 'Populist Anti-System', 'Other', 450),

-- Region 17: Eastern Herzegovina (90000 total: 3000 Bosniak, 5000 Croat, 80000 Serb, 2000 Other)
(17, 'Socialist Nationalist', 'Bosniak', 600),
(17, 'Liberal Reformist', 'Bosniak', 450),
(17, 'Nationalist Conservative', 'Bosniak', 1050),
(17, 'Civic Unitary', 'Bosniak', 450),
(17, 'Populist Anti-System', 'Bosniak', 450),
(17, 'Socialist Nationalist', 'Croat', 1000),
(17, 'Liberal Reformist', 'Croat', 750),
(17, 'Nationalist Conservative', 'Croat', 1750),
(17, 'Civic Unitary', 'Croat', 750),
(17, 'Populist Anti-System', 'Croat', 750),
(17, 'Socialist Nationalist', 'Serb', 16000),
(17, 'Liberal Reformist', 'Serb', 12000),
(17, 'Nationalist Conservative', 'Serb', 28000),
(17, 'Civic Unitary', 'Serb', 12000),
(17, 'Populist Anti-System', 'Serb', 12000),
(17, 'Socialist Nationalist', 'Other', 400),
(17, 'Liberal Reformist', 'Other', 300),
(17, 'Nationalist Conservative', 'Other', 700),
(17, 'Civic Unitary', 'Other', 300),
(17, 'Populist Anti-System', 'Other', 300),

-- Region 18: Brcko District (84000 total: 35000 Bosniak, 17000 Croat, 29000 Serb, 3000 Other)
(18, 'Socialist Nationalist', 'Bosniak', 7000),
(18, 'Liberal Reformist', 'Bosniak', 5250),
(18, 'Nationalist Conservative', 'Bosniak', 12250),
(18, 'Civic Unitary', 'Bosniak', 5250),
(18, 'Populist Anti-System', 'Bosniak', 5250),
(18, 'Socialist Nationalist', 'Croat', 3400),
(18, 'Liberal Reformist', 'Croat', 2550),
(18, 'Nationalist Conservative', 'Croat', 5950),
(18, 'Civic Unitary', 'Croat', 2550),
(18, 'Populist Anti-System', 'Croat', 2550),
(18, 'Socialist Nationalist', 'Serb', 5800),
(18, 'Liberal Reformist', 'Serb', 4350),
(18, 'Nationalist Conservative', 'Serb', 10150),
(18, 'Civic Unitary', 'Serb', 4350),
(18, 'Populist Anti-System', 'Serb', 4350),
(18, 'Socialist Nationalist', 'Other', 600),
(18, 'Liberal Reformist', 'Other', 450),
(18, 'Nationalist Conservative', 'Other', 1050),
(18, 'Civic Unitary', 'Other', 450),
(18, 'Populist Anti-System', 'Other', 450);

-- ============================================================
-- CANDIDATE REGION COEFFICIENTS
-- Initial coefficients based on ethnic alignment and candidate home region
-- ============================================================

-- Generate default coefficients for all candidate-region pairs
-- Bosniak candidates get higher coefficients in Bosniak-majority regions
-- Serb candidates get higher coefficients in Serb-majority regions
-- Croat candidates get higher coefficients in Croat-majority regions
-- Home region bonus: +0.15

INSERT INTO candidate_region_coefficients (candidate_id, region_id, coefficient)
SELECT c.id, r.id,
    ROUND(
        -- Base coefficient from ethnic alignment
        CASE 
            WHEN c.ethnicity = 'Bosniak' THEN (r.bosniak_pop / r.population) * 0.8
            WHEN c.ethnicity = 'Serb' THEN (r.serb_pop / r.population) * 0.8
            WHEN c.ethnicity = 'Croat' THEN (r.croat_pop / r.population) * 0.8
            ELSE (r.other_pop / r.population) * 0.8
        END
        -- Home region bonus
        + CASE WHEN c.home_region_id = r.id THEN 0.15 ELSE 0 END
        -- Base minimum
        + 0.1,
        3
    )
FROM candidates c
CROSS JOIN regions r;

-- ============================================================
-- ACTIONS - Campaign actions with reach coefficients
-- ============================================================

INSERT INTO actions (name, type, base_cost, base_support_gain, charisma_cost, reach_coefficient, description, rules) VALUES
-- Global campaigns (affect all regions)
('TV', 'campaign', 100000, 0.045, 5, 0.300, 'National TV campaign – reaches all regions, strongest media impact', '{"scope": "global", "tv_eligible": true}'),
('Social Media', 'campaign', 40000, 0.035, 0, 0.250, 'Social media blitz – affordable way to reach younger demographics nationally', '{"scope": "global"}'),
('Radio', 'campaign', 60000, 0.040, 0, 0.200, 'Radio advertising – effective in rural areas, moderate national reach', '{"scope": "global"}'),

-- Local campaigns (affect selected region only)
('Billboards', 'campaign', 15000, 0.040, 0, 0.120, 'Billboard campaign in the chosen region – steady visibility', '{"scope": "local", "spending_scalable": true}'),
('Small Meeting', 'campaign', 10000, 0.045, 0, 0.080, 'Small local meeting – personal touch, builds grassroots support', '{"scope": "local", "spending_scalable": true}'),
('Rally', 'campaign', 35000, 0.070, 0, 0.150, 'Large rally in the chosen region – energizes supporters, media coverage', '{"scope": "local", "spending_scalable": true}'),
('Door to Door', 'campaign', 25000, 0.065, 0, 0.100, 'Door-to-door canvassing – most personal, converts undecided voters', '{"scope": "local", "door_discount": true, "spending_scalable": true}'),
('Big Rally', 'campaign', 50000, 0.100, 0, 0.200, 'Massive final-week rally – major momentum boost, high risk/reward', '{"scope": "local", "last_week_only": true, "spending_scalable": true}');

-- Fundraising actions
INSERT INTO actions (name, type, base_cost, base_budget_gain, reach_coefficient, description, rules) VALUES
('Local Fundraiser', 'fundraising', 0, 30000, 0, 'Organize a local fundraising event – reliable income', '{"spending_scalable": false}'),
('Diaspora Gala', 'fundraising', 0, 75000, 0, 'Host a fundraising gala targeting diaspora – big one-time boost', '{"once_per_game": true, "spending_scalable": false}'),
('Corporate Donations', 'fundraising', 0, 45000, 0, 'Solicit donations from corporate sponsors – good returns', '{"spending_scalable": false}'),
('Online Crowdfunding', 'fundraising', 0, 20000, 0, 'Launch an online crowdfunding campaign – small but steady', '{"spending_scalable": false}');

-- Skills (cost charisma)
INSERT INTO actions (name, type, base_cost, charisma_cost, reach_coefficient, description, rules) VALUES
('TV Media Bonus', 'skill', 0, 15, 0, 'Gain +25% effectiveness on TV campaigns for 3 turns', '{"duration": 3, "effect": "tv_bonus", "bonus": 0.25}'),
('Door-to-Door Discount', 'skill', 0, 10, 0, 'Reduce door-to-door campaign costs by 30% for 3 turns', '{"duration": 3, "effect": "door_discount", "discount": 0.30}'),
('Foreign Aid', 'skill', 0, 12, 0, 'Increase fundraising gains by 25% for 3 turns', '{"duration": 3, "effect": "foreign_aid", "bonus": 0.25}');

-- Ultimate ability
INSERT INTO actions (name, type, base_cost, base_support_gain, charisma_cost, reach_coefficient, description, rules) VALUES
('Ultimate Campaign Push', 'ultimate', 0, 0.14, 50, 0.350, 'Deploy all accumulated charisma for a massive regional support boost', '{"spending_scalable": false, "fatigue_applies": true}');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DONE
-- ============================================================
