JSHINT := node_modules/.bin/jshint
JSHINTFLAGS :=--config=.jshintrc --exclude=scripts/make/js-semicolon.js

css_files := $(shell node scripts/make/css-files.js)
js_files := $(shell node scripts/make/js-files.js)
js_src_files := $(shell find client/src server server.js scripts -name '*.js')

all: install jshint js css

# For argument parsing. See http://stackoverflow.com/a/6273809.
%:
	@:

admin:
	@node scripts/make/create-admin-user.js

compile: js css

css: $(css_files)
	@cat $(css_files) > client/broker.css

db:
	@node scripts/make/init-database.js

deploy:
	@git push dokku

install:
	@npm install
	@cd client && bower install

items:
	@node scripts/items-$(filter-out $@,$(customer)).js

items-server:
	@ssh deploy@i.nicksergeant.com -p 55555 'cd /var/www/broker; make items customer=$(filter-out $@,$(customer))'

js: $(js_files)
	@cat $(js_files) > client/broker.js

jshint: $(js_src_files)
	@$(JSHINT) $(JSHINTFLAGS) $(js_src_files)

user:
	@node scripts/make/create-user.js

.PHONY: admin compile css db deploy fuel install js jshint user
