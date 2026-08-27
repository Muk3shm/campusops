import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    ScanCommand,
    GetCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand,
    DynamoDBDocumentClient
} from "@aws-sdk/lib-dynamodb";


// ======================================================
// 1. DYNAMODB CONFIGURATION
// ======================================================

const client = new DynamoDBClient({
    region: "ap-south-1"
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "CampusOpsRequests";


// ======================================================
// 2. LAMBDA HANDLER
// ======================================================

export const handler = async (event) => {

    try {

        // --------------------------------------------------
        // Get request ID
        // --------------------------------------------------

        const requestId =
            event?.pathParameters?.requestId ||
            event?.requestId;


        // --------------------------------------------------
        // Detect HTTP method
        // --------------------------------------------------

        const method =
            event?.requestContext?.http?.method ||
            event?.httpMethod ||
            event?.method ||
            "GET";


        // ==================================================
        // GET ONE REQUEST
        // ==================================================

        if (method === "GET" && requestId) {

            const result = await docClient.send(
                new GetCommand({
                    TableName: TABLE_NAME,

                    Key: {
                        requestId: requestId
                    }
                })
            );


            // Request does not exist
            if (!result.Item) {

                return {
                    statusCode: 404,

                    body: JSON.stringify({
                        message: "Service request not found"
                    })
                };
            }


            // Request found
            return {
                statusCode: 200,

                body: JSON.stringify({
                    message:
                        "Service request retrieved successfully",

                    request: result.Item
                })
            };
        }



        // ==================================================
        // GET ALL REQUESTS
        // ==================================================

        if (method === "GET") {

            const result = await docClient.send(
                new ScanCommand({
                    TableName: TABLE_NAME
                })
            );


            return {
                statusCode: 200,

                body: JSON.stringify({
                    message:
                        "Requests retrieved successfully",

                    count:
                        result.Items?.length || 0,

                    requests:
                        result.Items || []
                })
            };
        }



        // ==================================================
        // POST - CREATE NEW REQUEST
        // ==================================================

        if (method === "POST") {

            const body =
                typeof event.body === "string"
                    ? JSON.parse(event.body)
                    : event.body || event;


            // Basic validation
            if (
                !body.title ||
                !body.category ||
                !body.description ||
                !body.location ||
                !body.reportedBy
            ) {

                return {
                    statusCode: 400,

                    body: JSON.stringify({
                        message:
                            "title, category, description, location and reportedBy are required"
                    })
                };
            }


            // Generate unique request ID
            const newRequestId =
                `SR-${Date.now()}`;


            const now =
                new Date().toISOString();


            const request = {

                requestId:
                    newRequestId,

                title:
                    body.title,

                category:
                    body.category,

                description:
                    body.description,

                location:
                    body.location,

                priority:
                    body.priority || "MEDIUM",

                status:
                    "OPEN",

                reportedBy:
                    body.reportedBy,

                assignedTo:
                    null,

                resolutionNotes:
                    null,

                createdAt:
                    now,

                updatedAt:
                    now
            };


            await docClient.send(
                new PutCommand({

                    TableName:
                        TABLE_NAME,

                    Item:
                        request
                })
            );


            return {
                statusCode: 201,

                body: JSON.stringify({

                    message:
                        "Service request created successfully",

                    request:
                        request
                })
            };
        }



        // ==================================================
        // PATCH - UPDATE REQUEST
        // ==================================================

        if (method === "PATCH" && requestId) {

            const body =
                typeof event.body === "string"
                    ? JSON.parse(event.body)
                    : event.body || {};


            // Check whether request exists
            const existingRequest =
                await docClient.send(

                    new GetCommand({

                        TableName:
                            TABLE_NAME,

                        Key: {
                            requestId:
                                requestId
                        }
                    })
                );


            if (!existingRequest.Item) {

                return {
                    statusCode: 404,

                    body: JSON.stringify({
                        message:
                            "Service request not found"
                    })
                };
            }


            // Fields that are allowed to change
            const allowedFields = [
                "status",
                "assignedTo",
                "assigneeName",
                "resolutionNotes",
                "priority",
                "title",
                "category",
                "description",
                "location"
            ];

            const updates = [];

            const expressionAttributeNames = {};

            const expressionAttributeValues = {};


            for (const field of allowedFields) {

                if (
                    body[field] !== undefined &&
                    body[field] !== null
                ) {

                    updates.push(
                        `#${field} = :${field}`
                    );


                    expressionAttributeNames[
                        `#${field}`
                    ] = field;


                    expressionAttributeValues[
                        `:${field}`
                    ] = body[field];
                }
            }


            // Nothing valid supplied
            if (updates.length === 0) {

                return {
                    statusCode: 400,

                    body: JSON.stringify({
                        message:
                            "No valid fields provided for update"
                    })
                };
            }


            // Always update timestamp
            updates.push(
                "#updatedAt = :updatedAt"
            );


            expressionAttributeNames[
                "#updatedAt"
            ] = "updatedAt";


            expressionAttributeValues[
                ":updatedAt"
            ] = new Date().toISOString();



            const result =
                await docClient.send(

                    new UpdateCommand({

                        TableName:
                            TABLE_NAME,

                        Key: {
                            requestId:
                                requestId
                        },

                        UpdateExpression:
                            `SET ${updates.join(", ")}`,

                        ExpressionAttributeNames:
                            expressionAttributeNames,

                        ExpressionAttributeValues:
                            expressionAttributeValues,

                        ReturnValues:
                            "ALL_NEW"
                    })
                );


            return {
                statusCode: 200,

                body: JSON.stringify({

                    message:
                        "Service request updated successfully",

                    request:
                        result.Attributes
                })
            };
        }



        // ==================================================
        // DELETE REQUEST
        // ==================================================

        if (method === "DELETE" && requestId) {


            // First check whether the request exists
            const existing =
                await docClient.send(

                    new GetCommand({

                        TableName:
                            TABLE_NAME,

                        Key: {
                            requestId:
                                requestId
                        }
                    })
                );


            // Request doesn't exist
            if (!existing.Item) {

                return {
                    statusCode: 404,

                    body: JSON.stringify({
                        message:
                            "Service request not found"
                    })
                };
            }



            // Delete request
            await docClient.send(

                new DeleteCommand({

                    TableName:
                        TABLE_NAME,

                    Key: {
                        requestId:
                            requestId
                    }
                })
            );


            return {
                statusCode: 200,

                body: JSON.stringify({

                    message:
                        "Service request deleted successfully",

                    requestId:
                        requestId
                })
            };
        }



        // ==================================================
        // UNSUPPORTED OPERATION
        // ==================================================

        return {

            statusCode: 400,

            body: JSON.stringify({

                message:
                    "Unsupported operation"

            })
        };


    }

    catch (error) {


        console.error(
            "CampusOps API Error:",
            error
        );


        return {

            statusCode: 500,

            body: JSON.stringify({

                message:
                    "Failed to process request",

                error:
                    error.message

            })
        };
    }
};