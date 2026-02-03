#!/usr/bin/env node
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

/**
 * Validation script for QnABot conditional chaining expressions
 * 
 * This script analyzes a QnABot export file to identify QIDs that use conditional
 * chaining expressions and validates them against the new safe expression evaluator.
 * 
 * Usage:
 *   node validate-conditional-chaining.js <path-to-export.json>
 * 
 * Example:
 *   node validate-conditional-chaining.js qna-export.json
 */

const fs = require('fs');
const path = require('path');

// Import the safe expression evaluator directly from the Lambda layer
const { tokenize, validateTokens } = require(path.join(__dirname, '../lambda/es-proxy-layer/lib/fulfillment-event/safeExpressionEvaluator'));

// Constants
const REPORT_WIDTH = 80;

/**
 * Create a generic context object for validation
 * This matches the typical QnABot runtime context
 */
function createGenericContext() {
    return {
        SessionAttributes: {},
        Question: '',
        Sentiment: 0,
        UserInfo: {},
        Settings: {},
        LexOrAlexa: '',
        event: {},
        req: {},
        res: {}
    };
}

/**
 * Check if the conditional chaining string is a Lambda function
 */
function isLambdaExpression(conditionalChaining) {
    if (!conditionalChaining || typeof conditionalChaining !== 'string') {
        return false;
    }
    
    const trimmed = conditionalChaining.trim();
    
    // Check for Lambda functions
    // Handles: Lambda::, "Lambda::, 'Lambda::, `Lambda::, with optional whitespace
    return /^['"`]?\s*lambda::/i.test(trimmed);
}

/**
 * Validate a single conditional chaining expression
 */
function validateExpression(expression, qid) {
    const context = createGenericContext();
    const result = {
        qid,
        expression,
        valid: false,
        error: null
    };
    
    try {
        const tokens = tokenize(expression);
        validateTokens(tokens, context);
        result.valid = true;
    } catch (error) {
        result.valid = false;
        result.error = error.message;
    }
    
    return result;
}

/**
 * Validate QnABot export data structure and expressions
 * Returns validation results without printing
 */
function validateExportFile(data) {
    // Validate file structure
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid export file format. Expected JSON object.');
    }
    
    if (!data.qna || !Array.isArray(data.qna)) {
        throw new Error('Invalid export file format. Expected { "qna": [...] }');
    }
    
    const qids = data.qna;
    const results = {
        total: qids.length,
        withChaining: 0,
        lambdaChaining: 0,
        validExpressions: 0,
        invalidExpressions: 0,
        failures: []
    };
    
    // Process each QID
    qids.forEach((item, index) => {
        // Validate QID structure
        if (!item || typeof item !== 'object') {
            console.warn(`Warning: Skipping invalid QID at index ${index} (not an object)`);
            return;
        }
        
        if (!item.qid) {
            console.warn(`Warning: Skipping QID at index ${index} (missing 'qid' property)`);
            return;
        }
        
        const conditionalChaining = item.conditionalChaining;
        
        if (!conditionalChaining || typeof conditionalChaining !== 'string') {
            return;
        }
        
        results.withChaining++;
        
        // Skip Lambda functions
        if (isLambdaExpression(conditionalChaining)) {
            results.lambdaChaining++;
            return;
        }

        const expression = conditionalChaining.trim();
        
        // Validate the expression
        const validationResult = validateExpression(expression, item.qid);
        
        if (validationResult.valid) {
            results.validExpressions++;
        } else {
            results.invalidExpressions++;
            results.failures.push(validationResult);
        }
    });
    
    return results;
}

/**
 * Print validation report to console
 */
function printReport(results, filePath) {
    console.log(`\n${'='.repeat(REPORT_WIDTH)}`);
    console.log('QnABot Conditional Chaining Validation Report');
    console.log(`${'='.repeat(REPORT_WIDTH)}\n`);
    console.log(`Analyzing: ${filePath}\n`);
    
    // Print summary
    console.log('SUMMARY');
    console.log(`${'-'.repeat(REPORT_WIDTH)}`);
    console.log(`Total QIDs:                           ${results.total}`);
    console.log(`QIDs with conditional chaining:       ${results.withChaining}`);
    console.log(`  - Lambda functions (not validated): ${results.lambdaChaining}`);
    console.log(`  - Valid expressions:                ${results.validExpressions}`);
    console.log(`  - INVALID expressions:              ${results.invalidExpressions}`);
    console.log();
    
    // Print detailed failures
    if (results.invalidExpressions > 0) {
        console.log(`\n${'='.repeat(REPORT_WIDTH)}`);
        console.log('FAILED VALIDATIONS - ACTION REQUIRED');
        console.log(`${'='.repeat(REPORT_WIDTH)}\n`);
        
        results.failures.forEach((failure, index) => {
            console.log(`${index + 1}. QID: ${failure.qid}`);
            console.log(`   Expression: ${failure.expression}`);
            console.log(`   Error: ${failure.error}`);
            console.log();
        });
        
        console.log(`${'='.repeat(REPORT_WIDTH)}`);
        console.log('RECOMMENDATION');
        console.log(`${'-'.repeat(REPORT_WIDTH)}`);
        console.log('The expressions above will FAIL with the new safe evaluator.');
        console.log('Please review and update these QIDs before upgrading.');
        console.log(`${'='.repeat(REPORT_WIDTH)}\n`);
    } else {
        console.log(`${'='.repeat(REPORT_WIDTH)}`);
        console.log('✓ ALL CONDITIONAL CHAINING EXPRESSIONS ARE VALID');
        console.log(`${'='.repeat(REPORT_WIDTH)}\n`);
        console.log('Your QnABot export is compatible with the new safe evaluator.');
        console.log('You can proceed with the upgrade.\n');
    }
}

/**
 * Process QnABot export file - orchestrates reading, validation, and reporting
 */
function processExportFile(filePath) {
    // Read and parse the export file
    let data;
    try {
        let fileContent = fs.readFileSync(filePath, 'utf8');
        // Remove BOM if present
        if (fileContent.charCodeAt(0) === 0xFEFF) {
            fileContent = fileContent.slice(1);
        }
        data = JSON.parse(fileContent);
    } catch (error) {
        console.error(`ERROR: Failed to read or parse file: ${error.message}`);
        process.exit(1);
    }
    
    // Validate the export data
    let results;
    try {
        results = validateExportFile(data);
    } catch (error) {
        console.error(`ERROR: ${error.message}`);
        process.exit(1);
    }
    
    // Print the report
    printReport(results, filePath);
    
    // Exit with appropriate code
    process.exit(results.invalidExpressions > 0 ? 1 : 0);
}

/**
 * Print help message
 */
function printHelp() {
    console.log(`
QnABot Conditional Chaining Validation Tool

USAGE:
  node validate-conditional-chaining.js <path-to-export.json>
  node validate-conditional-chaining.js --help

DESCRIPTION:
  Validates conditional chaining expressions in a QnABot export file against
  the new safe expression evaluator. Identifies expressions that will fail
  after upgrading to the secure evaluator.

ARGUMENTS:
  <path-to-export.json>    Path to QnABot export JSON file

OPTIONS:
  --help, -h               Show this help message

EXAMPLES:
  node validate-conditional-chaining.js qna-export.json
  node validate-conditional-chaining.js ./exports/production-backup.json

EXIT CODES:
  0    All expressions are valid
  1    One or more expressions failed validation or error occurred
`);
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    // Handle help flag
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        printHelp();
        process.exit(args.length === 0 ? 1 : 0);
    }
    
    const filePath = path.resolve(args[0]);
    
    if (!fs.existsSync(filePath)) {
        console.error(`ERROR: File not found: ${filePath}`);
        process.exit(1);
    }
    
    processExportFile(filePath);
}

module.exports = { validateExpression, createGenericContext, validateExportFile, printReport };
