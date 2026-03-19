
USE ewaste_management;
SHOW DATABASES;
SHOW TABLES;
SELECT id, email, role FROM users WHERE email = 'recycler@test.com';
UPDATE recycler_profiles
SET approval_status = 'APPROVED'
WHERE user_id = 'e49d6e8b-4a4b-4433-b8c8-1446e9f6569b';

SELECT approval_status
FROM recycler_profiles
WHERE user_id = 'e49d6e8b-4a4b-4433-b8c8-1446e9f6569b';
SELECT * FROM users;
SELECT email FROM users;


USE ewaste_management;

SET SQL_SAFE_UPDATES = 0;

UPDATE recycler_profiles
SET approval_status = 'APPROVED';

SET SQL_SAFE_UPDATES = 1;



SELECT id, user_id, approval_status FROM collector_profiles;


SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE recycling_certificates;
TRUNCATE TABLE feedback;
TRUNCATE TABLE ewaste_items;
TRUNCATE TABLE pickup_requests;
TRUNCATE TABLE collector_profiles;
TRUNCATE TABLE recycler_profiles;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

SELECT COUNT(*) FROM users;




USE ewaste_management;
UPDATE users
SET role = 'ADMIN'
WHERE email = 'admin@ecoswap.in';





USE ewaste_management;

INSERT INTO users (
    id,
    email,
    password_hash,
    name,
    phone,
    address,
    role,
    avatar,
    is_active
) VALUES (
    UUID(),
    'admin@ecoswap.com',
    '$2b$12$u8Yy7p1HkH6Tn6k0rZ8nQeWk5dL7oXqQJXx0O0s8sH5Q1e7Zl2YvG', 
    'Arishr',
    '9360731198',
    '10, Race Course Road, Coimbatore, Tamil Nadu 641018',
    'ADMIN',
    NULL,
    TRUE
);


USE ewaste_management;
 INSERT INTO users (
    id,
    name,
    email,
    phone,
    address,
    password_hash,
    role
)
VALUES (
    UUID(),
    'System Admin',
    'admin@ecoswap.com',
    '+919876543210',
    'EcoSwap HQ, Peelamedu, Coimbatore, Tamil Nadu 641004',
    '$2b$12$7NipQsb4HpGuruoPcBfhYeK5h6nzuqcPpXfH/zxJ9Vyn1IFAN7Ma2',
    'ADMIN'
);




USE ewaste_management;

SELECT id, name, email, role
FROM users
WHERE email = 'admin@ecoswap.com';






USE ewaste_management;
ALTER TABLE recycling_certificates
ADD COLUMN file_path VARCHAR(255);


SELECT id, status, recycler_id FROM pickup_requests;

SELECT id, status, collector_id
FROM pickup_requests
WHERE status='REQUESTED';

SELECT id, status, collector_id, scheduled_date
FROM pickup_requests
WHERE status = 'REQUESTED';


SELECT id, status, collector_id
FROM pickup_requests
ORDER BY created_at DESC;

SELECT * FROM recycler_profiles;

SELECT email, role FROM users;


UPDATE users
SET password_hash = '$2b$12$7NipQsb4HpGuruoPcBfhYeK5h6nzuqcPpXfH/zxJ9Vyn1IFAN7Ma2'
WHERE email = 'admin@ecoswap.com';








USE ewaste_management;

SELECT id, email, avatar
FROM users
WHERE id = '1278d9e8-c4d0-449e-bf87-e5baec57b178';

SET SQL_SAFE_UPDATES = 1;
USE ewaste_management;

SET SQL_SAFE_UPDATES = 0;

UPDATE users
SET avatar = REPLACE(
  avatar,
  'http://127.0.0.1:5000',
  'http://127.0.0.1:8080'
)
WHERE avatar LIKE 'http://127.0.0.1:5000%';

SET SQL_SAFE_UPDATES = 1;

SHOW TABLES;

SELECT email, role, password_hash
FROM users
WHERE email = 'admin@ecoswap.com';


UPDATE users
SET password_hash = '$2b$12$CVNd0hE7RhUhLNrQKIH6nuThnnljZUbPvUqw3xtgBu4cNd4SzmQ2e'
WHERE email = 'admin@ecoswap.com';


DESCRIBE recycling_certificates;














USE ewaste_management;

SELECT id, email, avatar
FROM users
WHERE avatar LIKE 'http://127.0.0.1:5000%';