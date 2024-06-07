# Designer and Client UI Websites
Builds designer UI and client UI pages

## Running unit tests
In order to run the unit test for the website, go to the solution's home directory then run the npm command to launch the unit test
```
cd ../ # If you are currently in the website/ folder
npm run test:website
```

The unit test configuration can be found in the **package.json** file in the solution's home directory. The unit test uses jest and so its configuration can be found under the **jest** attribute in the package.json file.
