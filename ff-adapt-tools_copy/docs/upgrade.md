# Upgrading Adapt

Our instances are on [Amazon EC2 eu-west-2](https://eu-west-2.console.aws.amazon.com/ec2/v2/home?region=eu-west-2#Instances:sort=tag:Name).

If you want to connect to the instance you need the file `vivb.pem` on your machine.
You can find it on LastPass.

## Upgrading

1. Make a snapshot of the current image
2. List the process you should have something like this:

```
ubuntu@ip-10-43-0-134:~/adapt_authoring$ pm2 list
┌──────────┬────┬─────────┬──────┬───────┬────────┬─────────┬────────┬──────┬────────────┬────────┬──────────┐
│ App name │ id │ version │ mode │ pid   │ status │ restart │ uptime │ cpu  │ mem        │ user   │ watching │
├──────────┼────┼─────────┼──────┼───────┼────────┼─────────┼────────┼──────┼────────────┼────────┼──────────┤
│ server   │ 0  │ 0.4.1   │ fork │ 22316 │ online │ 3       │ 2M     │ 0.1% │ 120.9 MB   │ ubuntu │ disabled │
└──────────┴────┴─────────┴──────┴───────┴────────┴─────────┴────────┴──────┴────────────┴────────┴──────────┘
```

3. Close the connections to Port 5000 with:

```
$ pm2 stop server
$ pm2 start server
```

4. Upgrade the Adapt Authoring Tool

```
$ cd adapt_authoring/
$ cd git pull origin master
$ rm -rf node_modules
$ npm install
$ node upgrade
```

Find more information on [the official wiki](https://github.com/adaptlearning/adapt_authoring/wiki/Upgrading-the-Adapt-Authoring-Tool)

## Troubleshouting

### If you have a problem with the space disk

```
sudo du -x -h / | sort -h | tail -40
```

### Upgrading nodejs version

Check the stable version installed on the machine with

```
$ apt-cache policy nodejs
```

You can have a list of all the [last nodejs releases](https://github.com/nodesource/distributions/blob/master/README.md) to `curl`, and run

```
$ sudo apt-get install -y nodejs
```

### MongoDB

If you can connect to `MongoDB` try to relaunch the service

```
$ sudo service mongod restart
$ mongo
```

Find more information on the [official installtion documentation](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)

### Adapt Authoring Tool

After the update if you have errors on new courses like

> Missing required 'schema.subSchema' option for Object editor

> i is not a constructor

Connect to the instance and rebuild the dependencies with

```
grunt build
```
