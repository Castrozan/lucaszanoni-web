{
  include: [
    .[]
    | select(.origin.kind == "cloud-run")
    | {
        service_name: .origin.cloudRunServiceName,
        app_package_name: .source.appPackageName,
        app_directory_name: .source.appDirectoryName,
        app_mount_path: .mountPath,
        build_profile: .source.buildProfile
      }
  ]
}
