-- Migration: GLOBAL vs LOCAL campaigns (TV, Social Media, Radio = global; Billboards, Small Meeting, Rally, Door to Door, Big Rally = local)
USE outvoted;

-- Update existing campaign actions to new names, scope, costs
UPDATE actions SET name = 'TV', base_cost = 75000, base_support_gain = 0.06, description = 'National TV campaign – affects all regions by ethnicity and ideology', rules = '{"scope": "global", "tv_eligible": true}' WHERE type = 'campaign' AND name = 'TV Advertisement';
UPDATE actions SET name = 'Social Media', base_cost = 50000, base_support_gain = 0.04, description = 'Social media blitz – affects all regions by demographics', rules = '{"scope": "global"}' WHERE type = 'campaign' AND name = 'Social Media Campaign';
UPDATE actions SET name = 'Door to Door', base_cost = 30000, base_support_gain = 0.06, description = 'Door-to-door canvassing in the chosen region', rules = '{"scope": "local", "door_discount": true, "spending_scalable": true}' WHERE type = 'campaign' AND name = 'Door-to-Door Canvassing';
UPDATE actions SET name = 'Rally', base_cost = 40000, base_support_gain = 0.07, description = 'Large rally in the chosen region', rules = '{"scope": "local", "spending_scalable": true}' WHERE type = 'campaign' AND name = 'Rally Event';
UPDATE actions SET name = 'Big Rally', base_cost = 60000, base_support_gain = 0.10, description = 'Intensive final-week rally in the chosen region', rules = '{"scope": "local", "last_week_only": true, "spending_scalable": true}' WHERE type = 'campaign' AND name = 'Last Week Push';

-- Add new campaign actions if not present (by name)
INSERT INTO actions (name, type, base_cost, base_support_gain, description, rules)
SELECT 'Radio', 'campaign', 55000, 0.05, 'Radio advertising – affects all regions by ethnicity and ideology', '{"scope": "global"}'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM actions WHERE type = 'campaign' AND name = 'Radio');

INSERT INTO actions (name, type, base_cost, base_support_gain, description, rules)
SELECT 'Billboards', 'campaign', 25000, 0.04, 'Billboard campaign in the chosen region', '{"scope": "local", "spending_scalable": true}'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM actions WHERE type = 'campaign' AND name = 'Billboards');

INSERT INTO actions (name, type, base_cost, base_support_gain, description, rules)
SELECT 'Small Meeting', 'campaign', 20000, 0.035, 'Small local meeting in the chosen region', '{"scope": "local", "spending_scalable": true}'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM actions WHERE type = 'campaign' AND name = 'Small Meeting');
