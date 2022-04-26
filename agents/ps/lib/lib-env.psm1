Function Load-Env {
    param($name = "production")

    $settingsFile = (Split-Path -Path $PSScriptRoot -Parent) + "\local.settings.json" # (Resolve-Path -Path "local.settings.json")

    $config = (Get-Content -Path $settingsFile | ConvertFrom-Json -AsHashtable).env
    $env = $config[$name]
    
    $env.Keys | ForEach-Object {
        #Write-Host $_
        #Write-Host $env[$_]
        Set-Item "ENV:$_" $env[$_]
    }
}

Export-ModuleMember Load-Env