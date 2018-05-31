# how to make a QnABot release (merge develop to master)

1) test (this needs to be automated)
    1) test launching stack from public url
    2) test launching stack from github in burner account
    3) launch old master template, test upgrading to develop
    4) (optional) test in available regions 
        1) us-east-1
        2) us-west-2
        3) eu-west-1
2) document changes/fixes/breaks in CHANGELOG.md
3) increment semver in package.json
4) merge and push to github
5) tag release with semver
6) update public bucket with public template
