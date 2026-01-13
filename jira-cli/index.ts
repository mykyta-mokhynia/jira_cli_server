#!/usr/bin/env node
import * as dotenv from 'dotenv';
import axios, { AxiosError } from 'axios';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

// Load .env from project root
dotenv.config({ path: '../.env' });

const WEBAPP_URL = process.env.WEBAPP_URL;

if (!WEBAPP_URL) {
    console.error("Error: WEBAPP_URL is not defined in .env file.");
    process.exit(1);
}

interface ScriptParams {
    [key: string]: any;
}

const parser = yargs(hideBin(process.argv))
    .command('run <scriptName> [args]', 'Run a one-time script on the server', (yargs) => {
        return yargs
            .positional('scriptName', {
                describe: 'Name of the script to run (e.g. echo)',
                type: 'string',
                demandOption: true
            })
            .option('params', {
                alias: 'p',
                type: 'string',
                description: 'JSON string of parameters'
            })
            // Allow arbitrary flags to be passed as params
            .strict(false);
    }, async (argv) => {
        const scriptName = argv.scriptName as string;

        // Collect params:
        // 1. Parse --params JSON if exists
        let params: ScriptParams = {};
        if (argv.params && typeof argv.params === 'string') {
            try {
                params = JSON.parse(argv.params);
            } catch (e: any) {
                console.error("Error parsing --params JSON:", e.message);
                process.exit(1);
            }
        }

        // 2. Merge other flags (basic support for --msg="Hello")
        Object.keys(argv).forEach(key => {
            if (key !== '_' && key !== '$0' && key !== 'scriptName' && key !== 'params') {
                params[key] = argv[key];
            }
        });

        console.log(`Sending command: runScript -> ${scriptName}`);
        console.log(`Params:`, params);

        try {
            const response = await axios.post(WEBAPP_URL, {
                action: 'runScript',
                name: scriptName,
                params: params
            }, {
                headers: { 'Content-Type': 'application/json' },
                maxRedirects: 5
            });

            console.log("Response from Server:");
            console.log(JSON.stringify(response.data, null, 2));

        } catch (error: any) {
            console.error("Request Failed:");
            if (axios.isAxiosError(error) && error.response) {
                console.error(`Status: ${error.response.status}`);
                console.error(error.response.data);
            } else {
                console.error(error.message);
            }
        }
    })
    .demandCommand(1);

parser.parse();
