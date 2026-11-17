DROP INDEX snapshot_objects_by_kind;
CREATE INDEX snapshot_objects_by_kind
ON snapshot_objects (object_kind, object_key)
WHERE object_kind = 'raw-snapshot';
