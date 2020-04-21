<div>
    <a href="https://www.jhipster.tech/">
        <img src="https://www.jhipster.tech/images/logo/jhipster_family_member_1.svg" height="200px">
    </a>
</div>
Greetings, Java Hipster!

# generator-jhipster-multitenancy
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![License](http://img.shields.io/:license-apache-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0.html)
> A JHipster blueprint for creating multitenant applications


# Introduction
This is a [JHipster](https://www.jhipster.tech/) blueprint for creating multitenant applications. The blueprint will:

 - Generate a JHipster application
 - Generate a Tenant entity
 - Make the User, and any other entities, tenant aware

# Table of contents

* [Prerequisites](#prerequisites)
* [Installation](#installation)
  * [With NPM](#with-npm)
  * [With Yarn](#with-yarn)
* [Usage](#usage)
  * [Generate Multitenant Application](#generate-multitenant-application)
  * [Making an entity tenant aware](#making-an-entity-tenant-aware)
* [Running A Development Version](#running-a-development-version)
* [License](#license)

# Prerequisites

As this is a [JHipster](https://www.jhipster.tech/) blueprint, we expect you have JHipster v6.3.1 (newer versions are not yet supported) and its related tools already installed:

- [Installing JHipster](https://www.jhipster.tech/installation/)

# Installation

## With NPM

To install this blueprint:

```bash
npm install -g generator-jhipster-multitenancy
```

To update this blueprint:

```bash
npm update -g generator-jhipster-multitenancy
```

## With Yarn

To install this blueprint:

```bash
yarn global add generator-jhipster-multitenancy
```

To update this blueprint:

```bash
yarn global upgrade generator-jhipster-multitenancy
```

# Usage

## Generate Multitenant Application

To generate your JHipster Multitenant application using the blueprint, run the below command

```bash
jhipster --blueprints multitenancy
```

## Making an entity tenant aware

Once the blueprint has generated your application, a tenant entity has been created. All entitites created now can be made tenant aware. Create a new entity using the standard JHipster command.

```bash
jhipster entity Book
```

Upon generation, you will then be asked if you want to make your entity tenant aware.

```bash
Do you want to make Book tenant aware? (Y/n)
```

# Running A Development Version

During development of blueprint, please note the below steps. They are very important.

1. Link your blueprint globally

Note: If you do not want to link the blueprint(step 3) to each project being created, use NPM instead of Yarn as yeoman doesn't seem to fetch globally linked Yarn modules. On the other hand, this means you have to use NPM in all the below steps as well.

```bash
cd multitenancy
npm link
```

2. Link a development version of JHipster to your blueprint (optional: required only if you want to use a non-released JHipster version, like the master branch or your own custom fork)

You could also use Yarn for this if you prefer

```bash
cd generator-jhipster
npm link

cd multitenancy
npm link generator-jhipster
```

3. Create a new folder for the app to be generated and link JHipster and your blueprint there

```bash
mkdir my-app && cd my-app

npm link generator-jhipster-multitenancy
npm link generator-jhipster (Optional: Needed only if you are using a non-released JHipster version)

jhipster -d --blueprints multitenancy

```
# Sample Applications

If you would like to see sample apps for this multitenancy blueprint, check out our sample [Angular](https://github.com/sonalake/jhipster-mt-sample-angular) and [REACT](https://github.com/sonalake/jhipster-mt-sample-react) apps.

# License

Apache-2.0

[npm-image]: https://img.shields.io/npm/v/generator-jhipster-multitenancy.svg
[npm-url]: https://npmjs.org/package/generator-jhipster-multitenancy
[travis-image]: https://travis-ci.org/sonalake/generator-jhipster-multitenancy.svg?branch=master
[travis-url]: https://travis-ci.org/sonalake/generator-jhipster-multitenancy
[daviddm-image]: https://david-dm.org/sonalake/generator-jhipster-multitenancy.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/sonalake/generator-jhipster-multitenancy
