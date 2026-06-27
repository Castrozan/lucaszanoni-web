mock_provider "cloudflare" {}

variables {
  cloudflare_account_id = "0000000000000000000000000000abcd"
  zone_name             = "lucaszanoni.test"
  owner_account_email   = "owner@example.test"
  private_environment_apps = {
    db = {
      mount_path    = "/db/"
      audience_kind = "owner"
      audience_key  = ""
    }
  }
}

run "no_identity_provider_when_google_credentials_absent" {
  command = plan

  variables {
    google_sso_client_id     = ""
    google_sso_client_secret = ""
  }

  assert {
    condition     = length(cloudflare_zero_trust_access_identity_provider.google) == 0
    error_message = "absent Google credentials must provision no identity provider so each application keeps Cloudflare's default email one-time-pin login"
  }

  assert {
    condition     = cloudflare_zero_trust_access_application.app["db"].allowed_idps == null
    error_message = "with no Google identity provider the application must leave allowed_idps unset so the plan stays byte-identical to the pre-sso application"
  }

  assert {
    condition     = cloudflare_zero_trust_access_application.app["db"].auto_redirect_to_identity == null
    error_message = "with no Google identity provider the application must not auto-redirect to any identity"
  }

  assert {
    condition     = output.google_sso_login_enabled == false
    error_message = "the module must report Google sso login disabled while the credentials are empty"
  }
}

run "google_identity_provider_provisioned_and_bound_when_credentials_present" {
  command = plan

  variables {
    google_sso_client_id     = "test-google-client-id"
    google_sso_client_secret = "test-google-client-secret"
  }

  assert {
    condition     = length(cloudflare_zero_trust_access_identity_provider.google) == 1
    error_message = "present Google credentials must provision exactly one Google identity provider"
  }

  assert {
    condition     = cloudflare_zero_trust_access_identity_provider.google[0].type == "google"
    error_message = "the provisioned identity provider must be of type google so Cloudflare Access brokers Google sign-in natively"
  }

  assert {
    condition     = cloudflare_zero_trust_access_identity_provider.google[0].config.client_id == "test-google-client-id"
    error_message = "the Google identity provider must carry the supplied oauth client id"
  }

  assert {
    condition     = cloudflare_zero_trust_access_application.app["db"].auto_redirect_to_identity == true
    error_message = "with a single Google identity provider the application must auto-redirect so the visitor lands straight on the Google login"
  }

  assert {
    condition     = length(cloudflare_zero_trust_access_application.app["db"].allowed_idps) == 1
    error_message = "the application must allow exactly the one Google identity provider as its login method"
  }

  assert {
    condition     = output.google_sso_login_enabled == true
    error_message = "the module must report Google sso login enabled while the credentials are present"
  }
}
