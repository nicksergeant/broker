env_name: vagrant
hostname: local.broker.is
deploy_user: vagrant

users:
  -
    name: vagrant
    groups:
      - deploy
      - wheel

ssh:
    port: 22
