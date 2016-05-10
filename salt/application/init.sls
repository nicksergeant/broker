/var/www:
  file.directory:
    - user: {{ pillar.deploy_user }}
    - group: deploy
    - mode: 775
    - require:
      - user: {{ pillar.deploy_user }}
      - group: deploy

{% if pillar.env_name != 'vagrant' %}

/var/www/broker:
  file.directory:
    - user: {{ pillar.deploy_user }}
    - group: deploy
    - mode: 775
    - require:
      - group: deploy

  git.latest:
    - name: git@github.com:nicksergeant/broker.git
    - target: /var/www/broker
    - user: deploy

{% endif %}

/home/{{ pillar.deploy_user }}/tmp:
  file.absent

npm-install:
  npm.bootstrap:
    - name: /var/www/broker
    - user: {{ pillar.deploy_user }}
    - require:
      - pkg: build-essential
      - pkg: nodejs
      - pkg: graphicsmagick

bower:
  cmd.run:
    - user: {{ pillar.deploy_user }}
    - cwd: /var/www/broker/client
    - names:
      - bower install

/etc/supervisor/conf.d/broker.conf:
  file.managed:
    - source: salt://application/broker.supervisor.conf
    - template: jinja
    - makedirs: True
  cmd.run:
    - name: supervisorctl restart broker

broker-site:
  file.managed:
    - name: /etc/nginx/sites-available/broker
    - source: salt://application/broker.nginx.conf
    - template: jinja
    - group: deploy
    - mode: 755
    - require:
      - pkg: nginx
      - group: deploy

enable-broker-site:
  file.symlink:
    - name: /etc/nginx/sites-enabled/broker
    - target: /etc/nginx/sites-available/broker
    - force: false
    - require:
      - pkg: nginx
  cmd.run:
    - name: service nginx restart
    - require:
      - pkg: nginx
