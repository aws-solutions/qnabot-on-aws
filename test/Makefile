
up: ../build/templates/test.json
	npm run stack -- --input $$(pwd)/cfn/test.js --operation up

../build/templates/test.json: ./cfn/*
	../bin/build.js --input $$(pwd)/cfn/test.js --output $$(pwd)/../build/templates/test.json --verbose

