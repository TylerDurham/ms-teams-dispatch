import joi = require("joi");

// Load valid commands from settings. This will be used to validate the "command" property of session instances.
console.log(process.env["ValidCommands"])
const VALID_COMMANDS = ( process.env["ValidCommands"] ) ? process.env["ValidCommands"].split(",") : [];
if(VALID_COMMANDS.length == 0) console.warn( "WARNING: No ValidCommands configured.");

/**
 * Represents the partitionId of a session.
 */
export const PartitionKey = joi.object( {
    "userId": joi.string().required().email()
} );

/**
 * Represents the RowKey portion of a session passed to the REST API.
 */
export const RowKey = joi.object({
    "id": joi.string().required().alphanum(),
});

/**
 * Represents the primary keys of a session passed to the REST API.
 */
export const PrimaryKey = PartitionKey.concat( RowKey );

/**
 * Represents the extended schema (all required properties) of a session passed to the REST API.
 */
export const extendedSchema = PrimaryKey.keys({
    "command": joi.string().required().valid(...VALID_COMMANDS),
    "callback": joi.string().uri(),
    "status": joi.number(),
    "version": joi.string()
});
