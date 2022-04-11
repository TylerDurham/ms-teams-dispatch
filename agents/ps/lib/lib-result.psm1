[Flags()] enum ResultType {
    Success = 0
    Error = 1
}

Export-ModuleMember -Variable [ResultType]

function New-ResultError {
    param (
        $Message
    )

    return [PSCustomObject] @{
        type  = [ResultType]::Error
        message = $Message;
    } 
}

Export-ModuleMember -Function New-ResultError

function New-ResultSuccess {
    param (
        [PSObject] $Value
    )

    return [PSCustomObject] @{
        type    = [ResultType]::Success
        value   = $Value
    } 
}

Export-ModuleMember -Function New-ResultSuccess