node /var/www/broker/scripts/items-isles.js > /tmp/cron.isles:
  cron.present:
    - user: {{ pillar.deploy_user }}
    - hour: 2
    - minute: 45
    - require:
      - user: {{ pillar.deploy_user }}

node /var/www/broker/scripts/items-gifs.js > /tmp/cron.gifs:
  cron.present:
    - user: {{ pillar.deploy_user }}
    - hour: 4
    - minute: 0
    - require:
      - user: {{ pillar.deploy_user }}
