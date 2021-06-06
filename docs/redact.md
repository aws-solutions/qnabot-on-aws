# Optional Redact feature for log and metric output

QnABot can be configured to redact information written to CloudWatch logs, S3 metrics, and Kibana metrics logs.
This feature is disabled by default. Use the Designer UI Settings form to enable this feature. One can configure
the RegEx applied to strings as they are logged. If RegEx matches are found, the match is replaced with the string
'XXXXXX'.

The initial RegEx is

```regex
\b\d{4}\b(?![-])|\b\d{9}\b|\b\d{3}-\d{2}-\d{4}\b
```

This replaces 4 digit numbers not followed by a hyphen, a 9 digit number (SSN without hyphens), and a typical
SSN using nnn-nn-nnnn syntax with hyphens.