#!/usr/bin/env node
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

/**
 * Development server script with API proxy configuration
 * 
 * Usage:
 *   npm run dev:proxy -- --api-url https://abc123.execute-api.us-east-1.amazonaws.com --stage prod
 *   
 * Or set environment variables:
 *   QNABOT_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com QNABOT_STAGE=prod npm run dev:proxy
 * 
 * Or use CloudFormation stack name:
 *   npm run dev:proxy -- --stack-name my-qnabot-stack --region us-west-2
 * 
 * To remove localhost callback URLs from Cognito (cleanup):
 *   npm run dev:proxy -- --cleanup --stack-name my-qnabot-stack --region us-west-2
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createInterface } from 'readline';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
let apiUrl = process.env.QNABOT_API_URL;
let stage = process.env.QNABOT_STAGE || 'prod';
let stackName = process.env.QNABOT_STACK_NAME;
let region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
let cleanupMode = false;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--api-url' && args[i + 1]) {
        apiUrl = args[i + 1];
    } else if (args[i] === '--stage' && args[i + 1]) {
        stage = args[i + 1];
    } else if (args[i] === '--stack-name' && args[i + 1]) {
        stackName = args[i + 1];
    } else if (args[i] === '--region' && args[i + 1]) {
        region = args[i + 1];
    } else if (args[i] === '--cleanup') {
        cleanupMode = true;
    }
}

// If stack name is provided, try to get API URL from CloudFormation
let userPoolId, designerClientId;
if (stackName && !apiUrl) {
    const regionText = region ? ` in ${region}` : '';
    console.log(`Fetching API URL from CloudFormation stack: ${stackName}${regionText}...`);
    try {
        const { CloudFormationClient, DescribeStacksCommand } = await import('@aws-sdk/client-cloudformation');
        const clientConfig = region ? { region } : {};
        const client = new CloudFormationClient(clientConfig);
        const command = new DescribeStacksCommand({ StackName: stackName });
        const response = await client.send(command);
        
        const stack = response.Stacks?.[0];
        if (stack) {
            // Look for API Gateway URL in outputs - prioritize ApiEndpoint
            const apiOutput = stack.Outputs?.find(o => 
                o.OutputKey === 'ApiEndpoint'
            ) || stack.Outputs?.find(o => 
                o.OutputKey?.includes('ApiEndpoint') ||
                o.OutputKey?.includes('ApiUrl')
            );
            
            if (apiOutput?.OutputValue) {
                // Extract base URL without stage
                const url = new URL(apiOutput.OutputValue);
                apiUrl = `${url.protocol}//${url.host}`;
                
                // Extract stage from path if present
                const pathParts = url.pathname.split('/').filter(Boolean);
                if (pathParts.length > 0) {
                    stage = pathParts[0];
                }
                
                console.log(`Found API URL: ${apiUrl}`);
                console.log(`Detected stage: ${stage}`);
            }
            
            // Get Cognito User Pool and Client IDs for callback URL configuration
            const userPoolOutput = stack.Outputs?.find(o => o.OutputKey === 'UserPool');
            const designerClientOutput = stack.Outputs?.find(o => o.OutputKey === 'DesignerClientId');
            
            if (userPoolOutput?.OutputValue) {
                userPoolId = userPoolOutput.OutputValue;
            }
            if (designerClientOutput?.OutputValue) {
                designerClientId = designerClientOutput.OutputValue;
            }
        }
    } catch (error) {
        console.error('Failed to fetch CloudFormation stack info:', error.message);
        console.log('Falling back to manual configuration...');
    }
}

if (!apiUrl) {
    console.error('\n❌ Error: API URL not provided\n');
    console.log('Please provide the API URL using one of these methods:\n');
    console.log('1. Command line arguments:');
    console.log('   npm run dev:proxy -- --api-url https://abc123.execute-api.us-east-1.amazonaws.com --stage prod\n');
    console.log('2. Environment variables:');
    console.log('   QNABOT_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com QNABOT_STAGE=prod npm run dev:proxy\n');
    console.log('3. CloudFormation stack name:');
    console.log('   npm run dev:proxy -- --stack-name my-qnabot-stack --region us-west-2\n');
    process.exit(1);
}

// Validate URL format
try {
    new URL(apiUrl);
} catch (error) {
    console.error(`\n❌ Error: Invalid API URL format: ${apiUrl}\n`);
    console.log('URL should be in format: https://abc123.execute-api.us-east-1.amazonaws.com\n');
    process.exit(1);
}

console.log('\n🚀 Starting Vite dev server with proxy configuration:\n');
console.log(`   API URL: ${apiUrl}`);
console.log(`   Stage:   ${stage}`);
console.log(`   Proxy:   /${stage} -> ${apiUrl}/${stage}\n`);

// Prompt the user for confirmation via stdin
function confirm(question) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === 'y');
        });
    });
}

const localhostCallbacks = ['http://localhost:8080', 'http://localhost:8080/'];

// Build UpdateUserPoolClient params from the full DescribeUserPoolClient response,
// preserving all existing properties and only overriding the specified fields.
// This is critical: UpdateUserPoolClient is a full replacement — any property not
// included will be silently reset to its default value.
function buildUpdateParams(appClient, overrides) {
    const { ClientSecret, CreationDate, LastModifiedDate, ...updatableProps } = appClient;
    return { ...updatableProps, ...overrides };
}

// Remove localhost URLs from Cognito App Client callback and logout URLs.
// Returns true if URLs were removed, false otherwise.
async function removeCognitoLocalhostUrls(poolId, clientId, rgn) {
    const { CognitoIdentityProviderClient, DescribeUserPoolClientCommand, UpdateUserPoolClientCommand } = await import('@aws-sdk/client-cognito-identity-provider');
    const cognitoClient = new CognitoIdentityProviderClient({ region: rgn });

    const describeResponse = await cognitoClient.send(new DescribeUserPoolClientCommand({
        UserPoolId: poolId,
        ClientId: clientId,
    }));
    const appClient = describeResponse.UserPoolClient;

    const currentCallbacks = appClient.CallbackURLs || [];
    const currentLogoutUrls = appClient.LogoutURLs || [];
    const filteredCallbacks = currentCallbacks.filter(u => !localhostCallbacks.includes(u));
    const filteredLogoutUrls = currentLogoutUrls.filter(u => !localhostCallbacks.includes(u));

    if (filteredCallbacks.length === currentCallbacks.length && filteredLogoutUrls.length === currentLogoutUrls.length) {
        return false; // nothing to remove
    }

    await cognitoClient.send(new UpdateUserPoolClientCommand(buildUpdateParams(appClient, {
        CallbackURLs: filteredCallbacks,
        LogoutURLs: filteredLogoutUrls,
    })));
    return true;
}

// Handle --cleanup mode: remove localhost URLs and exit
if (cleanupMode) {
    if (!stackName) {
        console.error('\n❌ Error: --cleanup requires --stack-name\n');
        console.log('Usage: npm run dev:proxy -- --cleanup --stack-name my-qnabot-stack --region us-west-2\n');
        process.exit(1);
    }
    if (!userPoolId || !designerClientId || !region) {
        console.error('\n❌ Error: Could not determine Cognito User Pool ID, Client ID, or region from stack.\n');
        process.exit(1);
    }
    console.log('🧹 Removing localhost callback URLs from Cognito App Client...');
    console.log(`   User Pool ID:  ${userPoolId}`);
    console.log(`   Client ID:     ${designerClientId}`);
    console.log(`   Region:        ${region}\n`);
    try {
        const removed = await removeCognitoLocalhostUrls(userPoolId, designerClientId, region);
        if (removed) {
            console.log('✅ Removed localhost URLs from Cognito App Client.');
        } else {
            console.log('ℹ️  No localhost URLs found in Cognito App Client. Nothing to remove.');
        }
    } catch (error) {
        console.error('❌ Failed to remove localhost URLs:', error.message);
        process.exit(1);
    }
    process.exit(0);
}

// Track whether we added Cognito URLs so we can attempt cleanup on shutdown
let cognitoUrlsAdded = false;

// Add localhost callback URL to Cognito if we have the necessary info
if (userPoolId && designerClientId && region) {
    console.log('🔧 Configuring Cognito User Pool App Client for localhost development...');
    try {
        const { CognitoIdentityProviderClient, DescribeUserPoolClientCommand, UpdateUserPoolClientCommand } = await import('@aws-sdk/client-cognito-identity-provider');
        const cognitoClient = new CognitoIdentityProviderClient({ region });
        
        // Get current app client configuration
        const describeCommand = new DescribeUserPoolClientCommand({
            UserPoolId: userPoolId,
            ClientId: designerClientId,
        });
        const describeResponse = await cognitoClient.send(describeCommand);
        const appClient = describeResponse.UserPoolClient;
        
        // Check if localhost URLs are already in the callback URLs
        const localhostCallbacks = ['http://localhost:8080', 'http://localhost:8080/'];
        const currentCallbacks = appClient.CallbackURLs || [];
        const needsUpdate = localhostCallbacks.some(url => !currentCallbacks.includes(url));
        
        if (needsUpdate) {
            // Add localhost URLs to callback and logout URLs
            const newCallbacks = [...new Set([...currentCallbacks, ...localhostCallbacks])];
            const currentLogoutUrls = appClient.LogoutURLs || [];
            const newLogoutUrls = [...new Set([...currentLogoutUrls, ...localhostCallbacks])];

            // Confirm with the user before modifying the Cognito User Pool App Client
            console.log('\n⚠️  This will modify your Cognito User Pool App Client configuration:');
            console.log(`   User Pool ID:  ${userPoolId}`);
            console.log(`   Client ID:     ${designerClientId}`);
            console.log(`   Client Name:   ${appClient.ClientName}`);
            console.log(`   Region:        ${region}`);
            console.log('\n   The following localhost URLs will be added to CallbackURLs and LogoutURLs:');
            for (const url of localhostCallbacks.filter(u => !currentCallbacks.includes(u))) {
                console.log(`     + ${url}`);
            }
            console.log('');

            const proceed = await confirm('   Do you want to proceed? (y/N): ');
            if (!proceed) {
                console.log('   Skipped Cognito App Client update.');
                console.log('   You may need to manually add http://localhost:8080 to the allowed callback URLs.\n');
            } else {
                const updateCommand = new UpdateUserPoolClientCommand(buildUpdateParams(appClient, {
                    CallbackURLs: newCallbacks,
                    LogoutURLs: newLogoutUrls,
                }));
                
                await cognitoClient.send(updateCommand);
                cognitoUrlsAdded = true;
                console.log('✅ Added localhost URLs to Cognito App Client callback URLs\n');
            }
        } else {
            console.log('✅ Localhost URLs already configured in Cognito App Client');
        }
    } catch (error) {
        console.warn('⚠️  Could not update Cognito App Client:', error.message);
        console.log('   You may need to manually add http://localhost:8080 to the allowed callback URLs');
    }
}

console.log('📝 Note: After Cognito login, you may be redirected to the production URL.');
console.log('   If this happens, manually change the URL back to http://localhost:8080/?code=...');
console.log('   (Keep the ?code=... parameter from the redirect)\n');

// Create temporary vite config with proxy
const viteConfigPath = resolve(__dirname, '../vite.config.mjs');
const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');

// Check if proxy is already configured
if (viteConfigContent.includes('proxy: {') && !viteConfigContent.includes('proxy: {\n      //')) {
    console.log('⚠️  Warning: Proxy already configured in vite.config.mjs');
    console.log('   Using existing configuration. To use this script, comment out the proxy config.\n');
}

// Set environment variables for Vite to use
process.env.VITE_PROXY_TARGET = apiUrl;
process.env.VITE_PROXY_STAGE = stage;

// Also write to .env.local for Vite to pick up
const envLocalPath = resolve(__dirname, '../.env.local');
const envContent = `VITE_PROXY_TARGET=${apiUrl}\nVITE_PROXY_STAGE=${stage}\n`;
fs.writeFileSync(envLocalPath, envContent);
console.log('✅ Created .env.local with proxy configuration\n');

// Start Vite dev server
// Use npx to ensure vite is found from node_modules
const vite = spawn('npx', ['vite'], { // NOSONAR: npx command is safe in development environment with controlled PATH
    stdio: 'inherit',
    cwd: resolve(__dirname, '..'), // Run from website directory
    env: {
        ...process.env,
        VITE_PROXY_TARGET: apiUrl,
        VITE_PROXY_STAGE: stage,
    }
});

vite.on('close', (code) => {
    // Clean up .env.local on exit
    try {
        if (fs.existsSync(envLocalPath)) {
            fs.unlinkSync(envLocalPath);
            console.log('\n✅ Cleaned up .env.local');
        }
    } catch (error) {
        console.error('Failed to clean up .env.local:', error.message);
    }

    // Best-effort removal of localhost URLs from Cognito
    if (cognitoUrlsAdded && userPoolId && designerClientId && region) {
        console.log('🧹 Removing localhost callback URLs from Cognito App Client...');
        removeCognitoLocalhostUrls(userPoolId, designerClientId, region)
            .then((removed) => {
                if (removed) {
                    console.log('✅ Removed localhost URLs from Cognito App Client.');
                }
                process.exit(code);
            })
            .catch((error) => {
                console.warn('⚠️  Could not remove localhost URLs from Cognito App Client:', error.message);
                console.log('   Run with --cleanup to remove them manually:');
                console.log(`   npm run dev:proxy -- --cleanup --stack-name ${stackName} --region ${region}`);
                process.exit(code);
            });
    } else {
        process.exit(code);
    }
});

// Handle termination signals
process.on('SIGINT', () => {
    vite.kill('SIGINT');
});

process.on('SIGTERM', () => {
    vite.kill('SIGTERM');
});
