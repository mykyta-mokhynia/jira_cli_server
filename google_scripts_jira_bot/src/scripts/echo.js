/**
 * scripts/echo.js
 * A simple echo script for testing connections.
 */

function runEchoScript(params) {
    console.log("[EchoScript] Params received:", JSON.stringify(params));
    return {
        status: "success",
        message: params.msg || "No message provided",
        timestamp: new Date().toISOString()
    };
}
