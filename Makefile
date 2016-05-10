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
	@ssh deploy@i.nicksergeant.com -p 55555 'cd /var/www/broker; git pull'
	@ssh deploy@i.nicksergeant.com -p 55555 'cd /var/www/broker; make install'
	@ssh deploy@i.nicksergeant.com -p 55555 'cd /var/www/broker; make compile'
	@ssh deploy@i.nicksergeant.com -p 55555 'sudo supervisorctl restart broker'

fuel:
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'cd /var/www/broker; node scripts/items-showroom-fuel.js'

importdb:
	@ssh deploy@i.nicksergeant.com -p 55555 'rethinkdb dump -f dump.tar.gz'
	@scp -P 55555 deploy@i.nicksergeant.com:/home/deploy/dump.tar.gz .
	@ssh deploy@i.nicksergeant.com -p 55555 'rm -f /home/deploy/dump.tar.gz'
	@vagrant ssh -c 'cd /var/www/broker; node scripts/destroy-database.js'
	@vagrant ssh -c 'rethinkdb restore /var/www/broker/dump.tar.gz'
	@vagrant ssh -c 'rm -rf /var/www/broker/dump.tar.gz'

install:
	@npm install
	@cd client && bower install

items:
	@node scripts/items-$(filter-out $@,$(customer)).js

items-server:
	@ssh deploy@i.nicksergeant.com -p 55555 'cd /var/www/broker; make items customer=$(filter-out $@,$(customer))'

items-vagrant:
	@vagrant ssh -c 'cd /var/www/broker; make items customer=$(filter-out $@,$(customer))'

js: $(js_files)
	@cat $(js_files) > client/broker.js

jshint: $(js_src_files)
	@$(JSHINT) $(JSHINTFLAGS) $(js_src_files)

rs:
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo supervisorctl restart broker'

run: jshint
	@vagrant up
	@vagrant ssh -c 'cd /var/www/broker; make install'
	@vagrant ssh -c 'sudo supervisorctl restart broker && sudo supervisorctl tail -f broker stdout'

salt-server:
	@scp -q -P 55555 -r ./salt/ nick@173.255.225.244:salt
	@scp -q -P 55555 -r ./pillar/ nick@173.255.225.244:pillar
	@ssh nick@173.255.225.244 -p 55555 'sudo rm -rf /srv'
	@ssh nick@173.255.225.244 -p 55555 'sudo mkdir /srv'
	@ssh nick@173.255.225.244 -p 55555 'sudo mv ~/salt /srv/salt'
	@ssh nick@173.255.225.244 -p 55555 'sudo mv ~/pillar /srv/pillar'
	@ssh nick@173.255.225.244 -p 55555 'sudo salt-call --local state.highstate'

salt-vagrant:
	@scp -q -P 2222 -i ~/.vagrant.d/insecure_private_key -r ./salt/ vagrant@localhost:salt
	@scp -q -P 2222 -i ~/.vagrant.d/insecure_private_key -r ./pillar/ vagrant@localhost:pillar
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo rm -rf /srv'
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo mkdir /srv'
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo mv ~/salt /srv/salt'
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo mv ~/pillar /srv/pillar'
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo salt-call --local state.highstate'

server:
	@ssh root@173.255.225.244 'sudo apt-get update'
	@ssh root@173.255.225.244 'sudo apt-get install -y software-properties-common python-software-properties'
	@ssh root@173.255.225.244 'sudo add-apt-repository -y ppa:saltstack/salt'
	@ssh root@173.255.225.244 'sudo apt-get update'
	@ssh root@173.255.225.244 'sudo apt-get install -y salt-minion'
	@scp -q -P 22 -r ./salt/ root@173.255.225.244:salt
	@scp -q -P 22 -r ./pillar/ root@173.255.225.244:pillar
	@ssh root@173.255.225.244 'sudo rm -rf /srv'
	@ssh root@173.255.225.244 'sudo mkdir /srv'
	@ssh root@173.255.225.244 'sudo mv ~/salt /srv/salt'
	@ssh root@173.255.225.244 'sudo mv ~/pillar /srv/pillar'
	@ssh root@173.255.225.244 'sudo salt-call --local state.highstate'

user:
	@node scripts/make/create-user.js

vagrant:
	@vagrant up
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo apt-get update'
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo apt-get install -y software-properties-common python-software-properties'
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo add-apt-repository -y ppa:saltstack/salt'
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo apt-get update'
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo apt-get install -y salt-minion'
	@scp -q -P 2222 -i ~/.vagrant.d/insecure_private_key -r ./salt/ vagrant@localhost:salt
	@scp -q -P 2222 -i ~/.vagrant.d/insecure_private_key -r ./pillar/ vagrant@localhost:pillar
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo rm -rf /srv'
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo mkdir /srv'
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo mv ~/salt /srv/salt'
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo mv ~/pillar /srv/pillar'
	@ssh vagrant@localhost -p 2222 -i ~/.vagrant.d/insecure_private_key 'sudo salt-call --local state.highstate'

.PHONY: admin compile css db deploy fuel importdb install js jshint rs run salt-server salt-vagrant server user vagrant
