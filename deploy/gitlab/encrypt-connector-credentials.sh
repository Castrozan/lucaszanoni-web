set -euo pipefail
terraform -chdir=infra/environments/production output -raw jarvis_session_connector_credentials_json \
  | age -a \
    -r 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDXjYtc1kccaHnEeCnLfn5jB+3K8ULqIIsFoq+4pc+fX' \
    -r 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPdOdWOmB7IhmU70+VwgUJ40MHCOwhhrDBn6rq/Fskq/' \
    -r 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICpNZt8hGVbToPSE0nqVFXsGSM3Zae2tAH/lmVN5rD1x' \
    -r 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJw+IAmg/Vwv7U3BKyKl5fE+VidKx3ZPp8fkWJTy4jNG' \
    > connector-credentials.age
