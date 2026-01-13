/**
 * scripts/registry.js
 * Registry of one-time scripts that can be triggered via Webhook.
 * 
 * To add a new script:
 * 1. Import or define the function.
 * 2. Add it to the SCRIPT_REGISTRY object.
 */

const SCRIPT_REGISTRY = {
    'echo': runEchoScript
};

/**
 * Execute a script by name
 */
function outputScriptResult(scriptName, params) {
    const scriptFn = SCRIPT_REGISTRY[scriptName];

    if (!scriptFn) {
        throw new Error(`Script '${scriptName}' not found in registry.`);
    }

    console.log(`[ScriptRegistry] Running script: ${scriptName}`);
    return scriptFn(params);
}
