locals {
  origin_route_rules = [
    for prefix, origin_host in var.prefix_origin_hosts : {
      prefix      = prefix
      origin_host = origin_host
      expression  = format("starts_with(http.request.uri.path, \"%s\")", prefix)
    }
  ]
}
