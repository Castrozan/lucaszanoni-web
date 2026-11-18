CREATE TABLE report_objects (
  object_key TEXT NOT NULL PRIMARY KEY,
  content_type TEXT NOT NULL,
  byte_length INTEGER NOT NULL CHECK (byte_length >= 0),
  chunk_count INTEGER NOT NULL CHECK (chunk_count >= 0),
  report_content_hash TEXT NOT NULL CHECK (
    length(report_content_hash) = 64 AND report_content_hash NOT GLOB '*[^0-9a-f]*'
  )
) WITHOUT ROWID;

CREATE TABLE report_content_chunks (
  report_content_hash TEXT NOT NULL CHECK (
    length(report_content_hash) = 64 AND report_content_hash NOT GLOB '*[^0-9a-f]*'
  ),
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  bytes BLOB NOT NULL,
  PRIMARY KEY (report_content_hash, chunk_index)
) WITHOUT ROWID;

CREATE INDEX report_objects_by_content
ON report_objects (report_content_hash, object_key)
WHERE byte_length > 0;
