// https://docs.aws.amazon.com/kendra/latest/dg/gs-prerequisites.html 
// if no IAM role allowing access to Kendra, S3 then set that up first
// TODO: add cases for creating a Kendra index & S3 bucket if it does not already exist

const executeJava = () => {
    return new Promise((resolve, reject) => {
        const child = exec('java -jar createFAQ.jar', function (error, stdout, stderr) {
            console.log('Value at stdout is: ' + stdout); // here you get your result. In my case I did'nt needed to pass arguments to java program.
            resolve(stdout);
            if (error !== null) {
                console.log('exec error: ' + error);
                reject(error);
            }
        });
    })
}
