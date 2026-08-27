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
// 2. AUTHORIZATION & OWNERSHIP HELPERS
// ======================================================

function isRequestOwner(request, callerEmail, callerSub) {
    if (!request) return false;
    if (callerSub && request.reporterSub && request.reporterSub === callerSub) {
        return true;
    }
    if (callerEmail && request.reportedBy && request.reportedBy === callerEmail) {
        return true;
    }
    return false;
}

function isRequestAssignee(request, callerEmail, callerSub) {
    if (!request) return false;
    if (callerSub && request.assignedToSub && request.assignedToSub === callerSub) {
        return true;
    }
    if (callerSub && request.assignedTo && request.assignedTo === callerSub) {
        return true;
    }
    if (callerEmail && request.assignedTo && request.assignedTo === callerEmail) {
        return true;
    }
    return false;
}


// ======================================================
// 3. LAMBDA HANDLER
// ======================================================

export const handler = async (event) => {

    try {

        // --------------------------------------------------
        // Extract JWT Claims & Authenticated User Context
        // --------------------------------------------------

        const claims =
            event?.requestContext?.authorizer?.jwt?.claims ||
            event?.requestContext?.authorizer?.claims ||
            {};

        const callerSub = claims.sub || null;
        const callerEmail = claims.email || null;

        // Check authentication
        if (!callerSub && !callerEmail) {
            return {
                statusCode: 401,
                body: JSON.stringify({
                    message: "Authentication required"
                })
            };
        }

        // Normalize cognito:groups (supports native arrays, strings, CSVs, and JSON-stringified arrays)
        const rawGroups = claims["cognito:groups"] || claims["groups"];

        let callerGroups = [];

        if (Array.isArray(rawGroups)) {
            callerGroups = rawGroups.map(g => String(g).trim());
        } else if (typeof rawGroups === "string") {
            try {
                const parsed = JSON.parse(rawGroups);

                if (Array.isArray(parsed)) {
                    callerGroups = parsed.map(g => String(g).trim());
                } else {
                    callerGroups = [String(parsed).trim()];
                }
            } catch {
                callerGroups = rawGroups
                    .replace(/[\[\]"']/g, "")
                    .split(",")
                    .map(g => g.trim())
                    .filter(Boolean);
            }
        }

        const isAdmin = callerGroups.includes("ADMIN");
        const isTechnician = callerGroups.includes("TECHNICIAN");
        const isStaff = callerGroups.includes("STAFF");
        const isStudent = callerGroups.includes("STUDENT");

        // Verify caller has at least one recognized group role
        if (!isAdmin && !isTechnician && !isStaff && !isStudent) {
            return {
                statusCode: 403,
                body: JSON.stringify({
                    message: "Forbidden: No valid role assigned"
                })
            };
        }


        // --------------------------------------------------
        // Get request ID & Detect HTTP method
        // --------------------------------------------------

        const requestId =
            event?.pathParameters?.requestId ||
            event?.requestId;

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

            const item = result.Item;

            // Authorization check
            if (isAdmin) {
                // Admin access allowed
            } else if (isStudent || isStaff) {
                if (!isRequestOwner(item, callerEmail, callerSub)) {
                    return {
                        statusCode: 403,
                        body: JSON.stringify({
                            message: "You do not have access to this request"
                        })
                    };
                }
            } else if (isTechnician) {
                if (!isRequestAssignee(item, callerEmail, callerSub)) {
                    return {
                        statusCode: 403,
                        body: JSON.stringify({
                            message: "You do not have access to this request"
                        })
                    };
                }
            } else {
                return {
                    statusCode: 403,
                    body: JSON.stringify({
                        message: "Forbidden"
                    })
                };
            }

            // Request found and caller authorized
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Service request retrieved successfully",
                    request: item
                })
            };
        }


        // ==================================================
        // GET ALL REQUESTS
        // ==================================================

        if (method === "GET") {

            let scanParams = {
                TableName: TABLE_NAME
            };

            if (isAdmin) {
                // Admin retrieves all requests
            } else if (isStudent || isStaff) {
                scanParams.FilterExpression = "#reportedBy = :callerEmail OR #reporterSub = :callerSub";
                scanParams.ExpressionAttributeNames = {
                    "#reportedBy": "reportedBy",
                    "#reporterSub": "reporterSub"
                };
                scanParams.ExpressionAttributeValues = {
                    ":callerEmail": callerEmail || "",
                    ":callerSub": callerSub || ""
                };
            } else if (isTechnician) {
                scanParams.FilterExpression = "#assignedTo = :callerEmail OR #assignedTo = :callerSub OR #assignedToSub = :callerSub";
                scanParams.ExpressionAttributeNames = {
                    "#assignedTo": "assignedTo",
                    "#assignedToSub": "assignedToSub"
                };
                scanParams.ExpressionAttributeValues = {
                    ":callerEmail": callerEmail || "",
                    ":callerSub": callerSub || ""
                };
            }

            const result = await docClient.send(
                new ScanCommand(scanParams)
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Requests retrieved successfully",
                    count: result.Items?.length || 0,
                    requests: result.Items || []
                })
            };
        }


        // ==================================================
        // POST - CREATE NEW REQUEST
        // ==================================================

        if (method === "POST") {

            // Role permission check
            if (isTechnician && !isAdmin && !isStudent && !isStaff) {
                return {
                    statusCode: 403,
                    body: JSON.stringify({
                        message: "Technicians cannot create requests"
                    })
                };
            }

            if (!isAdmin && !isStudent && !isStaff) {
                return {
                    statusCode: 403,
                    body: JSON.stringify({
                        message: "Forbidden: You are not authorized to create requests"
                    })
                };
            }

            const body =
                typeof event.body === "string"
                    ? JSON.parse(event.body)
                    : event.body || event;

            // Basic field validation
            if (
                !body.title ||
                !body.category ||
                !body.description ||
                !body.location
            ) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: "title, category, description and location are required"
                    })
                };
            }

            // Generate unique request ID
            const newRequestId = `SR-${Date.now()}`;
            const now = new Date().toISOString();

            // Security identity derived EXCLUSIVELY from authenticated JWT claims.sub
            const callerSub = claims.sub || null;

            // Display metadata fallback from JWT claims or client session parameters
            const callerEmail =
                claims.email ||
                body.reportedBy ||
                null;

            const reporterName =
                claims.name ||
                claims["custom:name"] ||
                body.reporterName ||
                callerEmail ||
                null;

            const request = {
                requestId: newRequestId,
                title: body.title,
                category: body.category,
                description: body.description,
                location: body.location,
                priority: body.priority || "MEDIUM",
                status: "OPEN",
                reportedBy: callerEmail,
                reporterSub: callerSub,
                reporterName: reporterName,
                assignedTo: null,
                assignedToSub: null,
                assigneeName: null,
                resolutionNotes: null,
                createdAt: now,
                updatedAt: now
            };

            await docClient.send(
                new PutCommand({
                    TableName: TABLE_NAME,
                    Item: request
                })
            );

            return {
                statusCode: 201,
                body: JSON.stringify({
                    message: "Service request created successfully",
                    request: request
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

            // Fetch existing request
            const existingRequest = await docClient.send(
                new GetCommand({
                    TableName: TABLE_NAME,
                    Key: {
                        requestId: requestId
                    }
                })
            );

            if (!existingRequest.Item) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({
                        message: "Service request not found"
                    })
                };
            }

            const existing = existingRequest.Item;
            const bodyKeys = Object.keys(body);

            if (bodyKeys.length === 0) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: "No valid fields provided for update"
                    })
                };
            }

            let allowedFields = [];

            // Role-based validation & field whitelisting
            if (isAdmin) {
                allowedFields = [
                    "status",
                    "assignedTo",
                    "assignedToSub",
                    "assigneeName",
                    "resolutionNotes",
                    "priority",
                    "title",
                    "category",
                    "description",
                    "location"
                ];

                // Verify no non-allowed fields are present in request body
                for (const key of bodyKeys) {
                    if (!allowedFields.includes(key)) {
                        return {
                            statusCode: 403,
                            body: JSON.stringify({
                                message: `Forbidden: Field '${key}' cannot be modified`
                            })
                        };
                    }
                }

            } else if (isStudent || isStaff) {

                // Check ownership
                if (!isRequestOwner(existing, callerEmail, callerSub)) {
                    return {
                        statusCode: 403,
                        body: JSON.stringify({
                            message: "You do not have access to this request"
                        })
                    };
                }

                // Status constraint: OPEN requests only
                if (existing.status !== "OPEN") {
                    return {
                        statusCode: 403,
                        body: JSON.stringify({
                            message: "Students and staff can only edit OPEN requests"
                        })
                    };
                }

                allowedFields = [
                    "title",
                    "category",
                    "description",
                    "location",
                    "priority"
                ];

                // Strict check: Reject if any protected or invalid field is supplied
                for (const key of bodyKeys) {
                    if (!allowedFields.includes(key)) {
                        return {
                            statusCode: 403,
                            body: JSON.stringify({
                                message: `Forbidden: You are not authorized to modify protected field '${key}'`
                            })
                        };
                    }
                }

            } else if (isTechnician) {

                // Check assignment
                if (!isRequestAssignee(existing, callerEmail, callerSub)) {
                    return {
                        statusCode: 403,
                        body: JSON.stringify({
                            message: "Technicians can only modify assigned requests"
                        })
                    };
                }

                allowedFields = [
                    "status",
                    "resolutionNotes"
                ];

                // Strict check: Reject if any non-allowed field is supplied
                for (const key of bodyKeys) {
                    if (!allowedFields.includes(key)) {
                        return {
                            statusCode: 403,
                            body: JSON.stringify({
                                message: `Forbidden: Technicians cannot modify field '${key}'`
                            })
                        };
                    }
                }

            } else {
                return {
                    statusCode: 403,
                    body: JSON.stringify({
                        message: "Forbidden"
                    })
                };
            }

            const updates = [];
            const expressionAttributeNames = {};
            const expressionAttributeValues = {};

            for (const field of allowedFields) {
                if (
                    body[field] !== undefined &&
                    body[field] !== null
                ) {
                    updates.push(`#${field} = :${field}`);
                    expressionAttributeNames[`#${field}`] = field;
                    expressionAttributeValues[`:${field}`] = body[field];
                }
            }

            if (updates.length === 0) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: "No valid fields provided for update"
                    })
                };
            }

            // Always update timestamp
            updates.push("#updatedAt = :updatedAt");
            expressionAttributeNames["#updatedAt"] = "updatedAt";
            expressionAttributeValues[":updatedAt"] = new Date().toISOString();

            const result = await docClient.send(
                new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: {
                        requestId: requestId
                    },
                    UpdateExpression: `SET ${updates.join(", ")}`,
                    ExpressionAttributeNames: expressionAttributeNames,
                    ExpressionAttributeValues: expressionAttributeValues,
                    ReturnValues: "ALL_NEW"
                })
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Service request updated successfully",
                    request: result.Attributes
                })
            };
        }


        // ==================================================
        // DELETE REQUEST
        // ==================================================

        if (method === "DELETE" && requestId) {

            // Check whether request exists
            const existing = await docClient.send(
                new GetCommand({
                    TableName: TABLE_NAME,
                    Key: {
                        requestId: requestId
                    }
                })
            );

            if (!existing.Item) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({
                        message: "Service request not found"
                    })
                };
            }

            // Authorization check
            if (isAdmin) {
                // Admin allowed to delete
            } else if (isTechnician) {
                if (!isRequestAssignee(existing.Item, callerEmail, callerSub)) {
                    return {
                        statusCode: 403,
                        body: JSON.stringify({
                            message: "Technicians can only delete assigned requests"
                        })
                    };
                }
            } else {
                return {
                    statusCode: 403,
                    body: JSON.stringify({
                        message: "Forbidden: Deletion is not permitted for your role"
                    })
                };
            }

            // Delete request
            await docClient.send(
                new DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: {
                        requestId: requestId
                    }
                })
            );

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Service request deleted successfully",
                    requestId: requestId
                })
            };
        }


        // ==================================================
        // UNSUPPORTED OPERATION
        // ==================================================

        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "Unsupported operation"
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
                message: "Failed to process request",
                error: error.message
            })
        };
    }
};