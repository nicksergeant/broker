Broker
======

A fast UI for searching generic datasets.

Example sites
-------------

- <a href="http://comics.nicksergeant.com">comics.nicksergeant.com</a>
- <a href="http://gifs.nicksergeant.com">gifs.nicksergeant.com</a>
- <a href="http://hops.nicksergeant.com">hops.nicksergeant.com</a>
- <a href="http://isles.nicksergeant.com">isles.nicksergeant.com</a>
- <a href="http://movies.nicksergeant.com">movies.nicksergeant.com</a>
- <a href="http://showroom.nicksergeant.com">showroom.nicksergeant.com</a>
- <a href="http://wine.nicksergeant.com">wine.nicksergeant.com</a>

Running
-------

1. Install [Node](http://nodejs.org/).
2. Clone this repository.
3. `npm install`
4. `node server`
5. Visit [http://localhost:3000](http://localhost:3000).

If you'd like to create an initial admin user:

1. `cd broker`
2. `make admin`

Importing items
---------------

`make items customer=gifs`

Deploying
------

1. Use Heroku or [Dokku](https://github.com/dokku/dokku).
2. `git push dokku`
