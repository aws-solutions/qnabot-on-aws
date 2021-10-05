const commander = require("commander");
const aws = require("aws-sdk");

async function getAccountId() {
    let statusCode;
    let account_id = "";
    try {
        const sts = new aws.STS();
        const identity = await sts.getCallerIdentity().promise();
        account_id = identity.Account;
        statusCode = 200;
    } catch (error) {
        statusCode = error.statusCode;
        console.error(`Error in getAccountId: ${error.statusCode}, ${error.code}: ${error.message}`);
    }
    return { statusCode: statusCode, account_id: account_id };
}

async function checkBucketOwner(bucket) {
    let resp = { statusCode: 200 };
    try {
        const accountResp = await getAccountId();
        if (accountResp.statusCode !== 200) {
            resp = { statusCode: accountResp.statusCode };
            return resp;
        }
        console.debug(`Validating bucket ownership for bucket ${bucket} with account_id ${accountResp.account_id}`);
        let params = {
            Bucket: bucket,
            ExpectedBucketOwner: accountResp.account_id,
        };
        const s3 = new aws.S3();
        await s3.headBucket(params).promise();
        console.info(`Bucket ownership validation for bucket ${bucket} passed`);
    } catch (error) {
        resp = { statusCode: error.statusCode };
        let msg = `Validation failed: ${error.statusCode}, ${error.code}`;
        msg += error.message !== null ? `: ${error.message}\n` : "\n";
        if (error.statusCode === 404) {
            msg += "Error code 404 above indicates bucket not found. Check if bucket exists.\n";
        } else if (error.statusCode === 403) {
            msg +=
                "Error code 403 above indicates access denied. Check if the bucket is owned " +
                "by another account. You should use caution before attempting to " +
                "upload to this bucket. Correct the issue and retry the upload only after " +
                "you are certain that the bucket exists and is owned by your account.\n" +
                "If you want to bypass bucket ownership validation, then you can " +
                "use --ignore-bucket-ownership-validation option.\n";
        }
        console.error(msg);
        console.info(`Bucket ownership validation for bucket ${bucket} failed`);
    }
    return resp;
}

async function main() {
    const program = new commander.Command();
    let resp = { statusCode: 200 };
    program
        .version("1.0")
        .name("node bin/check_bucket_ownership")
        .description("Check S3 bucket ownership")
        .usage("[options]")
        .option("--bucket <string>", "the bucket name")
        .option(
            "--ignore-bucket-ownership-validation",
            [
                "bypass bucket ownership validation. Only use this option ",
                "if you trust owner of the bucket as being in another account. ",
                "You should use caution before attempting to upload to this ",
                "bucket.",
            ].join("")
        )
        .action(async options => {
            if (options.ignoreBucketOwnershipValidation) {
                console.warn(
                    "WARNING: ignoring bucket ownership validation since --ignore-bucket-ownership-validation " +
                        "is selected."
                );
                resp = { statusCode: 200 };
            } else {
                if (!options.bucket) {
                    console.log("error: required option '--bucket <string>' not specified");
                    process.exit(1);
                }
                resp = await checkBucketOwner(options.bucket);
            }
        });
    await program.parseAsync(process.argv);
    if (resp.statusCode !== 200) {
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
