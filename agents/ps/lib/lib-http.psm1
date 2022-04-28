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

function Set-TaskComplete {
    param (
        $UserId,
        $Id,
        $Payload
    )

    [string] $url = $env:API_TASK_COMPLETE.Replace("{userId}", $UserId).Replace("{id}", $id);

    Write-Output (Call-Service -Url $url -Method Patch -Payload $Payload -Debug:$DebugPreference)
}

function Get-TasksForUser {
    [CmdletBinding()]
    param (
        [string] $UserId
    )

    [string] $url = $env:API_TASK_GET_BY_USER_ID.Replace("{userId}", $UserId);

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