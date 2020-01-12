build:
	@tsc render.ts --resolveJsonModule
	@browserify render.js -o script.js

test:
	@tsc test.ts --resolveJsonModule
	@node test.js

package:
	@rm -r prehistoric
	@mkdir prehistoric
	@cp index.html prehistoric/index.html
	@cp script.js prehistoric/script.js
	@cp -rf assets prehistoric/assets

.PHONY: build test
