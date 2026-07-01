/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

import axios from 'axios';

// Helper: Get stage and bootstrap data
async function getStageAndData() {
    if (import.meta.env.DEV && import.meta.env.VITE_PROXY_STAGE) {
        return getDevelopmentStageAndData();
    }
    return getProductionStageAndData();
}

// Helper: Get stage and data in development mode
async function getDevelopmentStageAndData() {
    const stage = import.meta.env.VITE_PROXY_STAGE;
    const response = await Promise.resolve(axios.get(`/${stage}`));
    return { stage, data: response.data };
}

// Helper: Get stage and data in production mode
async function getProductionStageAndData() {
    try {
        const result = await Promise.resolve(axios.head(window.location.href));
        const stage = result.headers['api-stage'];
        
        if (!stage) {
            throw new Error('api-stage header not found in response');
        }
        
        const response = await Promise.resolve(axios.get(`/${stage}`));
        return { stage, data: response.data };
    } catch (error) {
        console.error('Bootstrap - Error getting stage:', error);
        throw error;
    }
}

// Helper: Convert absolute URL to relative API path
function convertToRelativePath(url, stage) {
    try {
        const urlObj = new URL(url);
        const relativePath = urlObj.pathname;
        return relativePath.replace(`/${stage}`, '');
    } catch (e) {
        // If it's already a relative URL or invalid, keep it as-is
        return url;
    }
}

// Helper: Convert API links to relative URLs for development proxy
function convertLinksToRelative(links, stage) {
    const skipConversion = ['CognitoEndpoint', 'OpenSearchDashboards'];
    
    Object.keys(links).forEach(key => {
        if (links[key]?.href && !skipConversion.includes(key)) {
            links[key].href = convertToRelativePath(links[key].href, stage);
        }
    });
}

// Helper: Build Cognito login URL for development
function buildCognitoLoginUrl(cognitoEndpoint, clientId) {
    const redirectUri = window.location.origin + window.location.pathname;
    return `${cognitoEndpoint}/login?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

// Helper: Configure Cognito login for development mode
function configureDevCognitoLogin(assigned) {
    const hasRequiredConfig = assigned._links?.CognitoEndpoint?.href && assigned.ClientIdDesigner;
    
    if (hasRequiredConfig) {
        const loginUrl = buildCognitoLoginUrl(
            assigned._links.CognitoEndpoint.href,
            assigned.ClientIdDesigner
        );
        assigned._links.DesignerLogin = { href: loginUrl };
    }
}

export default {
    async bootstrap(context) {
        const { stage, data } = await getStageAndData();
        const assigned = Object.assign(data, { stage });
        
        // Convert API URLs to relative paths in development mode
        if (import.meta.env.DEV && import.meta.env.VITE_PROXY_STAGE && assigned._links) {
            convertLinksToRelative(assigned._links, stage);
        }
        
        context.commit('info', assigned);
        
        // Configure Cognito login URL in development mode
        if (import.meta.env.DEV) {
            configureDevCognitoLogin(assigned);
        }
    },
};
