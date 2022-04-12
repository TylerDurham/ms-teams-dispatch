Add-Type @'
public enum ResultType {
    Success = 0,
    Error = 1
}
'@

function New-ResultError {
    param ( $Message )

    Write-Output [PSCustomObject] @{
        type    = [ResultType]::Error
        message = $Message;
    } 
}

function New-ResultSuccess {
    param ( [PSObject] $Value )

    Write-Output [PSCustomObject] @{
        type    = [ResultType]::Success
        value   = $Value
    } 
}

Export-ModuleMember -Function New-ResultSuccess, New-ResultError