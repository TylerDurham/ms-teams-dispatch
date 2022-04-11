$HTTP_HEADERS = @{
    "accept"    = "application/json"
    "content-type" = "application/json"
} 
[string] $URL_BASE = "http://localhost:7071/api/task/"

function Set-TaskComplete {
    param (
        $userId,
        $id,
        $body
    )
}

function Get-TasksForUser {
    param (
        [string] $UserId
    )

    $url = $URL_BASE + $UserId;
        
    Write-Debug "Calling host at '$url'."
    $response = Invoke-RestMethod -Method Get -Uri $url -Headers $HTTP_HEADERS -SkipHttpErrorCheck -StatusCodeVariable statusCode
    if ($response.type -eq 0) {
        return New-ResultSuccess -Value ($response.value)#| ConvertFrom-Json)
    }
    else {
        Write-Debug "HTTP error '$statusCode' while calling host at '$url'."
        return New-ResultError -Message $response.error.message
    }       
}