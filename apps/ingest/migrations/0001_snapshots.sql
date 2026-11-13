CREATE TABLE snapshot_objects (
  object_key TEXT NOT NULL PRIMARY KEY,
  object_kind TEXT NOT NULL CHECK (object_kind IN ('event', 'report', 'raw-snapshot')),
  content_type TEXT NOT NULL,
  byte_length INTEGER NOT NULL CHECK (byte_length >= 0),
  chunk_count INTEGER NOT NULL CHECK (chunk_count >= 0)
);

CREATE INDEX snapshot_objects_by_kind ON snapshot_objects (object_kind, object_key);

CREATE TABLE snapshot_object_chunks (
  object_key TEXT NOT NULL REFERENCES snapshot_objects (object_key) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  bytes BLOB NOT NULL,
  PRIMARY KEY (object_key, chunk_index)
);

CREATE TABLE snapshot_latest (
  topic TEXT NOT NULL PRIMARY KEY,
  event_object_key TEXT NOT NULL REFERENCES snapshot_objects (object_key),
  produced_at_epoch INTEGER NOT NULL
);
