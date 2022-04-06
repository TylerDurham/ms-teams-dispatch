# MS-TEAMS-DISPATCH

This is a work in progress.

## Local Development

This is how I setup my machine for local development.

### Clone the GIT Repo

Clone the GIT repo by running the following command(s):

```
git clone https://github.com/TylerDurham/msteams-dispatch.git && cd msteams-dispatch
```

### Install the NPM Packages

Ensure you are in the project root directory (```./msteams-dispatch```), and run the following command(s):

```
cd functions && npm install && cd ..
```

### Make a Copy of the Sample Azure Storage Settings

Ensure you are in the project root directory (```./msteams-dispatch```), and run the following command(s):

```
cp /functions/local.settings.sample.json ./functions/local.settings.json
```

### Launch the Visual Studio Code Workspace

This project is optimized for development in <a href="https://code.visualstudio.com/download" target="new">Visual Studio Code</a>

Ensure you are in the project root directory (```./msteams-dispatch```), and run the following command(s):

```
code code-workspace
```
### Configure the Azure Storage Settings

Description of Azure Storage Settings:

| **Key**                        | **Notes**                                                                                          |
|--------------------------------|----------------------------------------------------------------------------------------------------|
| _AzStorageTableAccountName_    | The name for the [Azure Storage] account.                                                            |
| AzStorageTableAccountKey       | The access key for the [Azure Storage] account.                                                      |
| _AzStorageTableName_           | The name of the table in the [Azure Storage] account.                                                |
| _ValidDispatchSessionCommands_ | A comma-delimited list of valid session commands. This is used to validate and formalize commands. |


Open ```./functions/local.settings.json```, and replace the below  ```__YOUR_AZ__``` tokens with your Azure Storage Settings.

Sample ```local.settings.json``` file:

``` json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzStorageTableAccountName": "__YOUR_AZ_STORAGE_ACCOUNT_NAME__",
    "AzStorageTableAccountKey": "__YOUR_AZ_STORAGE_ACCOUNT_KEY__",
    "AzStorageTableName": "__YOUR_AZ_STORAGE_TABLE_NAME__",
    "ValidDispatchCommands": "YOUR_COMMAND_1,YOUR_COMMAND_2,YOUR_COMMAND_3"
  }
}
```

[Azure Storage]: https://docs.microsoft.com/en-us/azure/storage/common/storage-introduction
