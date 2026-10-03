terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
  backend "gcs" {
    bucket = "zg-url-shortener-2026-lucaszanoni-web-tfstate"
    prefix = "gitlab-identity"
  }
}

provider "google" {
  project = "zg-url-shortener-2026"
}

resource "google_iam_workload_identity_pool" "gitlab" {
  workload_identity_pool_id = "lucaszanoni-web-gitlab"
  display_name              = "lucaszanoni-web GitLab"
}

resource "google_iam_workload_identity_pool_provider" "gitlab" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.gitlab.workload_identity_pool_id
  workload_identity_pool_provider_id = "gitlab"
  display_name                       = "GitLab protected main"
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.project_id" = "assertion.project_id"
  }
  attribute_condition = "assertion.project_id == '87199330' && assertion.ref_path == 'refs/heads/main' && assertion.ref_protected == 'true'"
  oidc {
    issuer_uri        = "https://gitlab.com"
    allowed_audiences = ["https://gitlab.com"]
  }
}

resource "google_service_account_iam_member" "gitlab_deployer" {
  service_account_id = "projects/zg-url-shortener-2026/serviceAccounts/lucaszanoni-web-deployer@zg-url-shortener-2026.iam.gserviceaccount.com"
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.gitlab.name}/attribute.project_id/87199330"
}
