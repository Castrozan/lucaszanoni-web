variable "cloudflare_account_id" {
  type = string
}

variable "zone_name" {
  type = string
}

variable "tunnel_name" {
  type    = string
  default = "lucaszanoni-jarvis-session"
}

variable "origin_hostname" {
  type = string
}

variable "additional_origin_hostnames" {
  type    = set(string)
  default = []
}

variable "tunnel_secret" {
  type      = string
  sensitive = true
}
