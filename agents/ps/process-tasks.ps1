[CmdletBinding()]
param(
    [int] $Interval = 5,
    [string] $EnvironmentName = "production",
    [string] $UserIdOverride
)

[string] $COMMAND_NAMESPACE = "com-microsoft-teams:dispatch-task:";

# Load all libary modules
Get-ChildItem -Path $PSScriptRoot -Include "*.psm1" -Depth 3 | ForEach-Object {
    Write-debug (("Loading module '" + ($_.Name) + "'.") -replace ".psm1")
    Import-Module -Name ($_.FullName) -WarningAction Ignore -Force
}

# Load local.settings.json into $ENV
Load-Env -name $EnvironmentName


try {
    $result = (& "echo-teams-env");
    if ($result.type -eq [ResultType]::Error) { Write-Error "Houston, we have a problem: " + $result.message; exit }
    
    $context = $result.value;
    $userId = $context.UserPrincipalName;
    if ($UserIdOverride.Trim().Length -gt 0) { $userId = $UserIdOverride }

    Write-Debug "Checking messages for user '$userId':"
    $result = Get-TasksForUser -UserId $userId -Debug:$DebugPreference
    if ($result.type -eq [ResultType]::Error) { $message = $result.message; Write-Error "Could not get user's tasks: $message"; exit }

    if ($null -eq $result.value) {
        Write-Host "No tasks to process for user '$userId'."
    } else {
        $result.value | ForEach-Object {
            $task = $_;
            $id = $task.id;
            $status = $task.status;
            $statusText = [DispatchTaskStatus]$status;
            $command = ($task.command -replace $COMMAND_NAMESPACE);

            if ($status -eq [DispatchTaskStatus]::Waiting) {
                # Task is in 'waiting' status
                Write-Debug "Executing task with status of $statusText ($status) and command of ($command)."
                $result = & $command
                if ($result.type -eq [ResultType]::Success) {
                    $json = $result.value | ConvertTo-Json -Compress
                    $payload = '{ "type": 0, "command": "' + $task.command + '", "value": ' + $json + ' }'
                    Write-Debug "Marking task [userId]:$userId [id]:$id complete with payload:"
                    Write-Debug $payload
                    $result = Set-TaskComplete -UserId $userId -Id $id -Payload ( $payload ) -Debug:$DebugPreference
                }
                else {

                }
            }
            else {
                # Ignore tasks with other status
                Write-Debug "Skipping task with status of $statusText ($status) and command of ($command)."
            }
        }
    }
}
catch {
    Write-Error "Unexpected error: $_";
}
finally {
    # Unload our custom modules
    Get-Module | ForEach-Object {
        if ($_.Path.StartsWith($PSScriptRoot)) {
            Write-Debug ("Removing module '" + $_.Name + "'.")
            Remove-Module -Name $_.Name
        }
    }    
}
