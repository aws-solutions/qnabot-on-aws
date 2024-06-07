# Export Lambda
This lambda is responsible for creating a JSON export of the questions defined in content designer. Once invoked, the lambda uploads the file to the S3 export bucket. The lambda can be invoked from the content designer 'Export' page where the file is also available for download. The exported questions are also used by Kendra FAQ, which is triggered and synchronized using the 'SYNC KENDRA FAQ' selection on the Content Designer Edit page.

## Tests
test are run using:
```shell
npm test
```

