# Utility Scripts that can be used post deploy to alter QnABot stack

## CMK based setup
Customer security/compliance policies sometimes require AWS KMS CMK to be used to encrypt content/configuration rather
than default AES-256 based keys. The configureCMK.py script allows a user to specify a KMS CMK ARN with which 
to encrypt QnABot Lambdas and Parameter Store settings.

Use 
python3 configureCMK.py <aws region> <CLOUDFORMATION STACK NAME> <KMS CMK ARN>

As an example

```
python3 configureCMK.py us-west-2 QnABotDevStack arn:aws:kms:us-west-2:nnnnnnnnnnnn:key/nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn
```

## CSV2JSON Converter
Utility to help with ingestion of your content in CSV format. See [CSV2JSON_README](./csv2json_converter/CSV2JSON_README.md).

## Conditional Chaining Validator
Validates QNABot export files against the new safe expression evaluator to identify compatibility issues before upgrading.

### Purpose
QNABot has moved from a permissive expression evaluation mechanism to a more restrictive safe evaluator that prevents security vulnerabilities. This script helps you identify which QIDs in your export will be affected by this change before you upgrade.

### What it checks
The script analyzes all QIDs with `conditionalChaining` expressions and validates them against the new security rules:
- No prototype manipulation (`__proto__`, `constructor`, etc.)
- No dynamic property access (bracket notation)
- No assignment operators (`=`, `++`, `--`)
- Only allowed method calls (`includes`, `startsWith`, `endsWith`, `indexOf`, `toLowerCase`, `toUpperCase`, `trim`)
- No standalone function calls
- Only known context identifiers

### Usage
```bash
node validate-conditional-chaining.js <path-to-export.json>
```

### Example
```bash
node validate-conditional-chaining.js qna-export.json
```

### Output
The script provides:
1. **Summary statistics**: Total QIDs, how many use conditional chaining, how many are valid/invalid
2. **Detailed failure report**: For each invalid expression, shows the QID, expression, and specific error
3. **Exit code**: 0 if all expressions are valid, 1 if any failures detected

### When to use
- Before upgrading to a version with the new safe expression evaluator (>v7.3.0)
- After making changes to conditional chaining expressions
- As part of your QNABot content review process
