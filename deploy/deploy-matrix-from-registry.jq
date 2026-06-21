{
  include: [
    .[]
    | select(.origin.kind == "in-repo-cloud-run")
    | {
        service_name: .origin.cloudRunServiceName,
        app_package_name: .origin.appPackageName,
        app_directory_name: .origin.appDirectoryName,
        app_mount_path: .mountPath,
        build_profile: .origin.buildProfile
      }
  ]
}
