
up: ../build/templates/test.json
	npm run stack -- --input $$(pwd)/cfn/index.js --operation up

../build/templates/test.json: ./cfn/*
	../bin/build.js --input $$(pwd)/cfn/index.js --output $$(pwd)/../build/templates/test.json --verbose

