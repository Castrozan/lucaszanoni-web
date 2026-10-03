set -eu
umask 077
: "${GITLAB_OIDC_TOKEN:?GitLab ID token is required}"
: "${GOOGLE_WORKLOAD_IDENTITY_PROVIDER:?Workload identity provider is required}"
: "${GOOGLE_DEPLOY_SERVICE_ACCOUNT:?Deployment identity is required}"
google_credentials_directory=$(mktemp -d)
printf '%s' "$GITLAB_OIDC_TOKEN" > "$google_credentials_directory/identity-token"
export GOOGLE_APPLICATION_CREDENTIALS="$google_credentials_directory/google-credentials.json"
jq -n \
  --arg audience "//iam.googleapis.com/$GOOGLE_WORKLOAD_IDENTITY_PROVIDER" \
  --arg service_account "$GOOGLE_DEPLOY_SERVICE_ACCOUNT" \
  --arg token_file "$google_credentials_directory/identity-token" \
  '{type: "external_account", audience: $audience, subject_token_type: "urn:ietf:params:oauth:token-type:jwt", token_url: "https://sts.googleapis.com/v1/token", service_account_impersonation_url: ("https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/" + $service_account + ":generateAccessToken"), credential_source: {file: $token_file}}' \
  > "$GOOGLE_APPLICATION_CREDENTIALS"
unset GITLAB_OIDC_TOKEN
