# CONTRIBUTING

The **Study Notes** project welcomes new contributors. This document will guide you
through the process.

### FORK

Fork the project [on GitHub](https://github.com/feross/studynotes) and check out
your copy.

```sh
$ git clone git@github.com:username/studynotes.git
$ cd studynotes
$ git remote add upstream git://github.com/feross/studynotes.git
```

### BRANCH

Create a feature branch and start hacking:

```sh
$ git checkout -b my-feature-branch
```

### COMMIT

Make sure git knows your name and email address:

```sh
$ git config --global user.name "J. Random User"
$ git config --global user.email "j.random.user@example.com"
```

Writing good commit logs is important.  A commit log should describe what
changed and why.

The header line should be meaningful; it is what other people see when they
run `git shortlog` or `git log --oneline`. Follow these guidelines when
writing one:

1. The first line should be 50 characters or less and contain a short
   description of the change.
2. Keep the second line blank.
3. Wrap all other lines at 72 columns.

A good commit log looks like this:

```
explaining the commit in one line

Body of commit message is a few lines of text, explaining things
in more detail, possibly giving some background about the issue
being fixed, etc etc.

The body of the commit message can be several paragraphs, and
please do proper word-wrap and keep columns shorter than about
72 characters or so. That way `git log` will show things
nicely even when it is indented.
```

### REBASE

Use `git rebase` (not `git merge`) to sync your work from time to time.

```sh
$ git fetch upstream
$ git rebase upstream/master
```

### DEVELOPER'S CERTIFICATE OF ORIGIN 1.0

By making a contribution to this project, I certify that:

* (a) The contribution was created in whole or in part by me and I have the
right to submit it under the open source license indicated in the file; or
* (b) The contribution is based upon previous work that, to the best of my
knowledge, is covered under an appropriate open source license and I have the
right under that license to submit that work with modifications, whether
created in whole or in part by me, under the same open source license (unless
I am permitted to submit under a different license), as indicated in the
file; or
* (c) The contribution was provided directly to me by some other person who
certified (a), (b) or (c) and I have not modified it.


### INSTALL

Once you have the code, install npm dependencies:

```bash
npm install
```

Install [MongoDB][], which is the database we use. On OS X, it's easy to install MongoDB
with [Homebrew][], a package manager.

First, install homebrew (if you don't already have it). Follow the intructions
[here][Homebrew]. Then run this:

```bash
brew install mongodb
```

Be sure to check the [MongoDB Installation Guides][] for any post-installation instructions relevant to your operating system. You may need that knowledge to run the mongod process at your system prompt prior to running this app.

### SETUP

Study Notes keeps sensitive information like secret keys and passwords in the file
`secret/index.js` which is not checked into git. There is an example file
`secret/index-sample.js` that shows what structure this file must take.

Create `secret/index.js` like this:

```bash
cp secret/index-sample.js secret/index.js
```

You can fill in information here, as required. But for just getting the site running, you
can leave it as-is.

### START SERVER

Simply run:

```bash
npm run watch-local
```

This single command does the following:

- Starts a local mongoDB
- Browserifies the JS files, and watches for changes
- Compiles the Stylus (CSS) files, and watches for changes
- Starts the node server, and watches for changes

Now, just open the site in a web browser:

**[http://localhost:4000/](http://localhost:4000/)**

That's it! If you have problems, open a GitHub issue.

[MongoDB]: http://www.mongodb.org/
[MongoDB Installation Guides]: http://docs.mongodb.org/manual/installation/#installation-guides
[Homebrew]: http://brew.sh/
