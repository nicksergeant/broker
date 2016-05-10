gm:
  pkgrepo.managed:
    - ppa: dhor/myway
    - require_in:
      - pkg: graphicsmagick
  pkg.latest:
    - name: graphicsmagick
    - refresh: True
