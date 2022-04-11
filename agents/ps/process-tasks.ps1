[CmdletBinding()]
param(
    [int] $Interval=5
)

[string] $COMMAND_NAMESPACE = "com-microsoft-teams:dispatch-task:";

function Split-TaskCommand {
    param (
        [string] $RawCommand
    )

    return $RawCommand -replace $COMMAND_NAMESPACE
}

function Process-Tasks {
    param (
        $Tasks
    )

    

    $Tasks | foreach-object {
        $task = $_;
        $status = $task.status;
        $command = Split-TaskCommand -RawCommand $task.command
        if ($status -eq 1 && $null -ne $command) {`
            # Task is in 'waiting' status
            Write-Debug "Executing task with status of ($status) and command of ($command)."
            $result = & $command
            if ($result.type -eq 1) {

            }   
        } else {
            # Ignore tasks with other status
            Write-Debug "Skipping task with status of ($status) and command of ($command)."
        }
    }
}



# Load all libary modules
Get-ChildItem -Path $PSScriptRoot -Include "*.psm1" -Depth 3 | ForEach-Object {
    #Write-Host "Module $_.Name"
    Import-Module -Name ($_.FullName) -WarningAction Ignore -Force
}

$command = "echo-teams-env"

try {
    $result = (& $Command);
    if ($result.type -eq 1) { Write-Error "Houston, we have a problem: " + $result.message; exit }
    
    $context    = $result.value;
    $userId     = $context.UserPrincipalName;

    Write-Debug "Checking messages for user '$userId':"
    $url = $URL_BASE + $userId;
    $result = Get-TasksForUser -UserId $userId
    if ($result.type -eq 1) { $message = $result.message; Write-Error "Could not get user's tasks: $message"; exit }

    $tasks = $result.value;
    Process-Tasks -Tasks ($tasks);

} catch {
    Write-Error "Unexpected error: $_";
} finally {
    # Unload our custom modules
    Get-Module | ForEach-Object {
        if($_.Path.StartsWith($PSScriptRoot)) {
            Write-Debug "Removing module '$_.Name'."
            Remove-Module -Name $_.Name
        }
    }

    #Get-Module | ft
    
}




#Result-Error

<#
Get-Module | Select Name
$result = New-ResultSuccess -Value "test" 
Write-Host ( $result | ft )

Remove-Module -Name "command-lib"
Remove-Module -Name "result-lib"
#>



exit

<#
$result = & (Join-Path -Path $PSScriptRoot -ChildPath "tasks" -AdditionalChildPath "echo-teams-env.ps1") | ConvertFrom-Json

if ($null -eq $result || $result.type -eq 1) { exit }

$TEAMS_CONTEXT = $result.value;
$TEAMS_USER_ID = $TEAMS_CONTEXT.UserPrincipalName
[string] $COMMAND_NAMESPACE = "com-microsoft-teams:dispatch-task:";
[string] $SERVICE_URL = "http://localhost:7071/api/task/" + $TEAMS_USER_ID
$HTTP_HEADERS = @{
    "accept"       = "application/json"
    "content-type" = "application/json"
} 

function Execute-Command {
    param (
        [string] $CommandPath
    )

    try { $result = & $CommandPath | ConvertFrom-Json }
    catch{ return }
}

function Prepare-Command {
    param (
        [string] $CommandText
    )

    return  (Join-Path -Path $PSScriptRoot -ChildPath "tasks" -AdditionalChildPath ($CommandText.Trim() + ".ps1")) 
}

function Parse-Command {
    param (
        [string] $RawCommand
    )

    [string[]] $data;

    $data = ($task.command -Split $COMMAND_NAMESPACE)
    if ($data.length -gt 1) {
        return ($data[$data.length - 1]).Trim();
    }

    return $null;
}

while ($true) {
    Write-Output "Checking messages for user '$TEAMS_USER_ID':"
    
    $messages = (Invoke-RestMethod -Method Get -Uri $SERVICE_URL -Headers $HTTP_HEADERS) # | ConvertFrom-Json

    Write-Host "Received " $messages.value.length " messages."

    $messages.value | foreach-object {
        $task = $_
        $command = Prepare-Command -CommandText (Parse-Command -rawCommand $task.command)
        Write-Host $command        
    }

    break;
    # Start-Sleep -Seconds 10  
}

#>
