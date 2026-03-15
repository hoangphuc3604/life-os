-- Create lifeos_auth database (default)
SELECT 'CREATE DATABASE lifeos_auth'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lifeos_auth')\gexec

-- Create lifeos_knowledge database
SELECT 'CREATE DATABASE lifeos_knowledge'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lifeos_knowledge')\gexec
