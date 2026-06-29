#!/usr/bin/env bash
set -euo pipefail

local_cockpit_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_root_directory="$(cd "${local_cockpit_directory}/.." && pwd)"
served_bundle_destination_path="${repository_root_directory}/apps/cockpit/public/local-cockpit.py"

cd "${local_cockpit_directory}"
python3 build_single_file_launcher.py
cp dist/local-cockpit.py "${served_bundle_destination_path}"

echo "regenerated served bundle at ${served_bundle_destination_path}"
echo "stage it with: git add ${served_bundle_destination_path}"
