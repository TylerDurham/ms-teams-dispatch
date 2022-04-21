Function Load-Env {
    param( $name = "default")

    $config = Get-Content -Path .\local.settings.json | ConvertFrom-Json

    

    Write-Host $config.environments[ $name ].SERVICE_URL

    
}

Export-ModuleMember Load-Env