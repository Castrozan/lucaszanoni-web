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

variable "tunnel_secret" {
  type      = string
  sensitive = true
}
