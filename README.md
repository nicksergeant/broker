Broker
======

A fast UI for searching generic datasets.

Install
-------

1. Install [Node](http://nodejs.org/), [Vagrant](http://www.vagrantup.com/), [VirtualBox](https://www.virtualbox.org/), and [Bower](http://bower.io/).
2. Clone this repository.
4. `make vagrant`
5. Grab a [beer](http://hops.is/).
6. Visit [http://local.broker.is:8080](http://local.broker.is:8080).

If you'd like to create an initial admin user:

1. `cd broker`
2. `vagrant ssh`
3. `cd /var/www/broker`
4. `make admin`

Running
-------

1. `cd broker`
2. `make run`

That's it.

The `node server` command is run via [Supervisor](http://supervisord.org/),
ensuring that the server stays up across reboots in production. If you change
a server-related file in development, the Node server will automatically reboot.

**Note: the following commands would be run within the Vagrant-installed
virtual machine (via `vagrant ssh`), not the host machine.**

Supervisor commands:

- `sudo supervisorctl restart broker` -- restarts the Node server.
- `sudo supervisorctl tail -f broker stdout` -- watch the Node server logs.

You can also use `ssc` instead of typing out `sudo supervisorctl` each time.

We've included some helpful aliases:

- `logs` -- runs `sudo supervisorctl tail -f broker stdout`.
- `run` -- restarts the Node server and begins watching logs. You can safely `Cmd + C` from here and the Node server will remain up.
- `rs` -- restart the Node server.

Stopping
--------

1. `cd broker`
2. `vagrant halt`

Importing items
---------------

Locally (from the host OS, not the VM):

`make items-vagrant customer=gifs`

On the server:

`make items-server customer=gifs`

Importing production database
-----------------------------

**Note: this will completely replace your local database with the production
database. Make sure you want to do this.**

`make importdb`

Develop
-------

- Use something like [LiveReload](http://livereload.com/) for compiling SCSS to CSS, using compilation type `compressed`.

Provision new server
--------------------

**Note: For now, provisioning new servers requires changing the IP address manually
in the Makefile.**

1. Change username and IP address in Makefile to point to the new server.
2. `make server`

Deploy
------

1. Ensure you're in directory `broker`.
2. `make deploy`
