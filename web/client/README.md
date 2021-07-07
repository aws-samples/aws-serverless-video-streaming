<!--
SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.

SPDX-License-Identifier: MIT-0 License
-->

# minimal-node-web-server

> Containerized Express Node Web Server -- Perfect for cheap hosting on AWS ECS, Digital Ocean, now.sh

> Evergreen, Alpine-based, Node LTS release

Pull the Docker Image [![](https://images.microbadger.com/badges/version/duluca/minimal-node-web-server.svg)](https://microbadger.com/images/duluca/minimal-node-web-server 'Get your own version badge on microbadger.com') `docker pull duluca/minimal-node-web-server`

> Looking for _npm scripts for Docker_? Go [here](https://gist.github.com/duluca/d13e501e870215586271b0f9ce1781ce#file-npm-scripts-for-docker-md)!

## Quick Start

Using this image as your web server is super easy.

1. Create a `Dockerfile` on your projects new folder.
2. Using `FROM` inherit from this image.
3. Set the `WORKDIR` to `/usr/src/app`
4. `COPY` your local `dist`, `build`, `public` or the folder that contains your finalized (transpiled, compiled, minified) output to the server's `public` folder.
5. Want to enforce `HTTPS`? See below.

### Dockerfile HTTP Example

```Dockerfile
FROM duluca/minimal-node-web-server

WORKDIR /usr/src/app

# (optional) ENV NODE_ENV=local

#COPY "your local folder on your development environment (dist, build, public, etc)" "server's public content folder inside the container (public)"
COPY dist public
```

See https://github.com/duluca/angular1.5-starter project as an example of how to use this container with your own front-end project.

## Why Should You Use This Image?

A simple Express.js server to serve web content from the public folder. Alpine Linux is utilized to achieve absolute minimal memory footprint (~25mb).

This is will work great, if all you're doing is serving static content. If you intend to run a full-stack Node.js application, then your mileage may vary for intense and highly sensitive workloads.

### HTTPS Forwarding

You may set `ENV ENFORCE_HTTPS=true` in your Dockerfile to forward all HTTP requests to HTTPS.

```Dockerfile
FROM duluca/minimal-node-web-server

WORKDIR /usr/src/app
COPY dist public

# Options [true | xProto | xArrSsl | forwardedHost]
ENV ENFORCE_HTTPS=true
```

_Beware:_ Setting up `HTTPS` in production is not a straight forward process. For the most part you'll be relying on your cloud provider to do the complicated stuff for you, like housing your private keys, reverse proxying or load balancing. In that case use the settings below _instead_ of `ENFORCE_HTTPS`:

| Environment                            | Header            | ENFORCE_HTTPS Value |
| -------------------------------------- | ----------------- | ------------------- |
| Generic                                |                   | `true`              |
| AWS, Heroku, Nginx, LoadBalancer, etc. | x-forwarded-proto | `xProto`            |
| Azure                                  | x-arr-ssl         | `xArrSsl`           |
| Custom                                 | X-Forwarded-Host  | `forwardedHost`     |

For instance health checks use `/healthCheck` to bypass HTTPS enforcement.

See https://www.npmjs.com/package/express-sslify for additional information.

### Reverse Proxy

If you're not using a cloud provider and would like to setup a reverse proxy, you can always roll your own. You would want to create a `docker-compose.yml` file, and use `jwilder/nginx-proxy` with this server.

> There's a treasure trove of information linked from https://hub.docker.com/r/jwilder/nginx-proxy/, if you'd like to set up your own reverse proxy.

### Multi-environment Support

This Docker image, by default, sets `process.env.NODE_ENV` to `production`. A production setting is required to enforce features like HTTPS, which is not something you would like to do on your local development environment. However you may have test, beta or staging environments. To treat these environment as production, specify them in a common seperated format as shown in the example below.

```Dockerfile
FROM duluca/minimal-node-web-server

WORKDIR /usr/src/app
COPY dist public

ENV ENVIRONMENTS=test,staging
```

## How To Use This Image?

You can fork it, modify it and go on your merry way. However, the intent is to even avoid that. Using the source code for this image as example, you can containirize your front-end application and with Docker Compose you can add this image as a dependency and host your Single Page Application (SPA) in its own container.

In any case, my recommendation would be to host your front-end and back-end code in seperate containers. This is in the spirit of a micro-services architecture. In addition, this approach physically enforces a seperation of concerns that is usually only implemented logically.

## New to Docker?

I intentionally kept the code simple and easy to read. It would be great exercise for you to understand how it exactly works end to end.

Read more about what Docker is, why it's important and how you can benefit from it [here](https://gist.github.com/duluca/25de70e41347f38b2283ef90ed69840a).

## How to Build, Run and Publish

There are three scripts in `package.json`

- `npm run docker:build` will rebuild the Docker image with any changes
- `npm run docker:run` will run the Docker image locally without having to publish it first
- `npm run docker:publish` will publish the image to http://hub.docker.com

## Resources

The environment is configured following best practices from [NodeSource](https://nodesource.com/blog/8-protips-to-start-killing-it-when-dockerizing-node-js/).

If you're interested in more advanced Node.js containers I recommend checking out official NodeSource containers.
