build:
	@tsc render.ts --resolveJsonModule --target es5
	@browserify render.js -o script.js
	@uglifyjs script.js > script.min.js

test:
	@tsc test.ts --resolveJsonModule
	@node test.js

package:
	@rm -r prehistoric
	@mkdir prehistoric
	@cp index.html prehistoric/index.html
	@cp script.js prehistoric/script.js
	@cp script.min.js prehistoric/script.min.js
	@cp -rf assets prehistoric/assets

.PHONY: build test
