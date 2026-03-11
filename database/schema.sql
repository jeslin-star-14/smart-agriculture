-- Database schema for smart agriculture project

CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  last_seen TIMESTAMP
);

CREATE TABLE sensor_data (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES devices(id),
  sensor_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW()
);
