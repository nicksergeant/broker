assets-site:
  file.managed:
    - name: /etc/nginx/sites-available/assets
    - source: salt://assets/assets.nginx.conf
    - template: jinja
    - group: deploy
    - mode: 755
    - require:
      - pkg: nginx
      - group: deploy

enable-assets-site:
  file.symlink:
    - name: /etc/nginx/sites-enabled/assets
    - target: /etc/nginx/sites-available/assets
    - force: false
    - require:
      - pkg: nginx
  cmd.run:
    - name: service nginx restart
    - require:
      - pkg: nginx
