build:
	@tsc render.ts
	@browserify render.js -o script.js

test:
	@tsc test.ts
	@node test.js

package:
	@mkdir prehistoric
	@cp index.html prehistoric/index.html
	@cp script.js prehistoric/script.js
	@cp -rf assets prehistoric/assets

.PHONY: build test
