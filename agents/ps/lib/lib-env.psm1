Function Load-Env {
    param($name = "production")

    try {


        $settingsFile = (Split-Path -Path $PSScriptRoot -Parent) + "\local.settings.json" # (Resolve-Path -Path "local.settings.json")

        if ( -Not (Test-Path -Path $settingsFile )) {
            Write-Error "Could not locate file $settingsFile. Aborting."
            Exit
        }


        $config = (Get-Content -Path $settingsFile | ConvertFrom-Json -AsHashtable).env
        $env = $config[$name]
        
        $env.Keys | ForEach-Object {
            #Write-Host $_
            #Write-Host $env[$_]
            Set-Item "ENV:$_" $env[$_]
        }
    } catch {
        Write-Error "Could not load configuration file! "
        Exit
    }
}

Export-ModuleMember Load-Env