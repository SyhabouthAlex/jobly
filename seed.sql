DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS users;

CREATE TABLE companies (
  handle text PRIMARY KEY,
  name text UNIQUE,
  num_employees integer,
  description text,
  logo_url text
);

CREATE TABLE jobs (
  id serial PRIMARY KEY,
  title text NOT NULL,
  salary numeric(10, 2) NOT NULL,
  equity numeric(3, 2) NOT NULL CHECK (equity <= 1),
  company_handle text NOT NULL REFERENCES companies (handle) ON DELETE CASCADE,
  date_posted timestamp DEFAULT current_timestamp
);

CREATE TABLE users (
  username text PRIMARY KEY,
  password text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  photo_url text,
  is_admin boolean NOT NULL DEFAULT false
);