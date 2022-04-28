Add-Type @'
public enum DispatchTaskStatus {
    Waiting = 1,
    Completed = 2,
    Error = 8
}
'@

enum HttpMethod  {
    Get = 1
    Patch = 9
}
$HTTP_HEADERS = @{
    "accept"    = "application/json"
    "content-type" = "application/json"
} 

[string] $URL_BASE  = $env:API_BASE_URL
[string] $KEY       = $env:API_CODE

function Set-TaskComplete {
    param (
        $UserId,
        $Id,
        $Payload
    )

    $url = $URL_BASE + $UserId + "/api/task/" + $Id + "/complete&code=" & $KEY;

    Write-Output (Call-Service -Url $url -Method Patch -Payload $Payload -Debug:$DebugPreference)
}

function Get-TasksForUser {
    [CmdletBinding()]
    param (
        [string] $UserId
    )

    $url = $URL_BASE + "/" + $UserId + "?code=" + $KEY;

    Write-Host $DebugPreference
    
    Write-Output (Call-Service -Url $url -Method Get -Debug:$DebugPreference)
}

function Call-Service {
    [CmdletBinding()]
    param (
        [HttpMethod] $Method,
        $Url,
        $Payload = $null
    )

    $methodName =  ([string]([HttpMethod]$Method )+ "").ToUpper()

    Write-Debug "Calling '$methodName' at '$url'."
    if ($null -ne $Payload) {
        $response = Invoke-RestMethod -Method $Method -Uri $Url -Headers $HTTP_HEADERS -Body $Payload -SkipHttpErrorCheck -StatusCodeVariable statusCode
    } else {
        $response = Invoke-RestMethod -Method $Method -Uri $Url -Headers $HTTP_HEADERS -SkipHttpErrorCheck -StatusCodeVariable statusCode
    }

    Write-Debug "'$methodName' at '$url' returned HTTP $statusCode."

    if ($response.type -eq [ResultType]::Success) {
        Write-Output (New-ResultSuccess -Value ($response.value))
    }
    else {
        Write-Debug "HTTP error '$statusCode' while calling host at '$url'."
        Write-Output (New-ResultError -Message $response.error.message)
    }
}

Export-ModuleMember Get-TasksForUser, Set-TaskComplete