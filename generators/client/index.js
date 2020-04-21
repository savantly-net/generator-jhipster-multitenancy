/* eslint-disable consistent-return */
const _ = require('lodash');
const chalk = require('chalk');
const ClientGenerator = require('generator-jhipster/generators/client');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const angularFiles = require('./files-angular');
const reactFiles = require('./files-react');
const mtUtils = require('../multitenancy-utils');

module.exports = class extends ClientGenerator {
    constructor(args, opts) {
        super(args, Object.assign({ fromBlueprint: true }, opts)); // fromBlueprint variable is important

        const jhContext = (this.jhipsterContext = this.options.jhipsterContext);

        if (!jhContext) {
            this.error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprint multitenancy')}`);
        }

        this.configOptions = jhContext.configOptions || {};

        // This sets up options for this sub generator and is being reused from JHipster
        jhContext.setupClientOptions(this, jhContext);
    }

    get initializing() {
        /**
         * Any method beginning with _ can be reused from the superclass `ClientGenerator`
         *
         * There are multiple ways to customize a phase from JHipster.
         *
         * 1. Let JHipster handle a phase, blueprint doesnt override anything.
         * ```
         *      return super._initializing();
         * ```
         *
         * 2. Override the entire phase, this is when the blueprint takes control of a phase
         * ```
         *      return {
         *          myCustomInitPhaseStep() {
         *              // Do all your stuff here
         *          },
         *          myAnotherCustomInitPhaseStep(){
         *              // Do all your stuff here
         *          }
         *      };
         * ```
         *
         * 3. Partially override a phase, this is when the blueprint gets the phase from JHipster and customizes it.
         * ```
         *      const phaseFromJHipster = super._initializing();
         *      const myCustomPhaseSteps = {
         *          displayLogo() {
         *              // override the displayLogo method from the _initializing phase of JHipster
         *          },
         *          myCustomInitPhaseStep() {
         *              // Do all your stuff here
         *          },
         *      }
         *      return Object.assign(phaseFromJHipster, myCustomPhaseSteps);
         * ```
         */
        // Here we are not overriding this phase and hence its being handled by JHipster
        return super._initializing();
    }

    get prompting() {
        // Here we are not overriding this phase and hence its being handled by JHipster
        return super._prompting();
    }

    get configuring() {
      // Here we are not overriding this phase and hence its being handled by JHipster
        return super._configuring();
    }

    get default() {
        // Here we are not overriding this phase and hence its being handled by JHipster
        return super._default();
    }

    get writing() {
        const writing = super._writing();
        const myCustomPhaseSteps = {
            // sets up all the variables we'll need for the templating
            setUpVariables() {
                // Ok
                this.webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;
                this.angularDir = jhipsterConstants.ANGULAR_DIR;
                this.reactDir = jhipsterConstants.REACT_DIR;
                this.CLIENT_TEST_SRC_DIR = jhipsterConstants.CLIENT_TEST_SRC_DIR;

                // template variables
                mtUtils.tenantVariables(this.config.get('tenantName'), this);
            },
            writeAdditionalFile() {
                // make the necessary client code changes and adds the tenant UI
                switch (this.clientFramework) {
                    case 'angularX':
                        return angularFiles.writeFiles.call(this);
                    case 'react':
                        return reactFiles.writeFiles.call(this);
                    default:
                        return angularFiles.writeFiles.call(this);
                }
            },
            rewriteExistingFiles() {
                // Rewrites to existing files
                switch (this.clientFramework) {
                    case 'angularX':
                        mtUtils.processPartialTemplates(angularFiles.templates(this), this);
                        break;
                    case 'react':
                        mtUtils.processPartialTemplates(reactFiles.templates(this), this);
                        break;
                    default:
                        mtUtils.processPartialTemplates(angularFiles.templates(this), this);
                }
            }
        };
        return Object.assign(writing, myCustomPhaseSteps);
    }

    get install() {
        // Here we are not overriding this phase and hence its being handled by JHipster
        return super._install();
    }

    get end() {
        // Here we are not overriding this phase and hence its being handled by JHipster
        return super._end();
    }
};
