.[]
| {
    path: .mountPath,
    allowedStatuses: (
      if (.status // "active") == "retired" then "410"
      elif (.accessModel.kind // "public") == "public" then "200"
      else "302,401"
      end
    )
  }
| "\(.path)\t\(.allowedStatuses)"
