function Get-TeamsDataFolder {
    param (
        [ValidateSet(1, 2)]
        [int]
        $Version = 1
    )
    if ($IsMacOS) {
        return "${HOME}/Library/Application Support/Microsoft/Teams"
    }
    if ($IsLinux) {
        return "${HOME}/.config/Microsoft/Microsoft Teams"
    }
    if ($Version -eq 1) {
        return "$($env:APPDATA)/Microsoft/Teams"
    }
    return "$($env:LOCALAPPDATA)/Packages/MicrosoftTeams_8wekyb3d8bbwe/LocalCache"      # this has 3 folders, Local, Microsoft, and Roaming, all have data of note
}

function Get-UserData {
    $DataFolder = Get-TeamsDataFolder
    $DesktopConfig = "$DataFolder/desktop-config.json"
    if (!(Test-Path -Path $DesktopConfig)) {
        return $null
    }
    
    $Config = Get-Content -Path $DesktopConfig | ConvertFrom-Json
    [PSCustomObject] @{
        UserPrincipalName = $Config.upnWindowUserUpn
        ObjectId          = $Config.userOid
        TenantId          = $Config.userTid
        Language          = $Config.currentWebLanguage
        Theme             = $Config.theme
        ClientVersion     = $Config.previousWebClientVersion
    } 
}

function echo-teams-env {
    $data = Get-UserData

    Write-Output (New-ResultSuccess -Value $data)
}

Export-ModuleMember -Function echo-teams-env
