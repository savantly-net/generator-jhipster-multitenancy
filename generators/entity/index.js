const util = require('util');
const chalk = require('chalk');
const generator = require('yeoman-generator');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const _ = require('lodash');
const mtUtils = require('../multitenancy-utils');
const partialFiles = require('./partials/index');
const pluralize = require('pluralize');

const JhipsterGenerator = generator.extend({});
util.inherits(JhipsterGenerator, BaseGenerator);

module.exports = JhipsterGenerator.extend({
    constructor: function (...args) {
        generator.apply(this, args);

        this.argument('name', {
            type: String,
            required: false,
            description: 'Entity name'
        });

        this.isValid = true;
        this.skipPrompt = false;

        const tenantName = _.toLower(this.config.get('tenantName'));
        if (_.toLower(this.options.name) === tenantName) {
            this.error('You can\'t select your tenant entity');
            this.isValid = false;
        } else if (this.options.name) {
            this.name = this.options.name;
        } else if (this.options.name === undefined && this.options.entityConfig) {
            // first check if the entityConfig is for the tenant entity
            if (this.options.entityConfig && _.toLower(this.options.entityConfig.entityClass) === tenantName) {
                // if so, then just ignore the config, and don't run the generator
                this.isValid = false;
            } else {
                this.name = _.toLower(this.options.entityConfig.entityClass);
            }
        }

        if (this.name) {
            // we got a value
            if (!this.options.entityConfig) {
                this.skipPrompt = true;
            }

            // check that the name hasn't already been done
            const preTenantisedEntities = this.config.get('tenantisedEntities');
            if (preTenantisedEntities && preTenantisedEntities.indexOf(this.name) >= 0) {
                // entity is already tenantised, show warning and skip generator
                this.log(chalk.green(`Entity ${chalk.bold(this.name)} has been tenantised`));
                this.isValid = false;
            }
        }

        // if we go this far, then we definitely have an entity to update
        this.options.name = this.name;
        this.context = {};
    },
    initializing: {
        readConfig() {
            this.jhipsterAppConfig = this.getAllJhipsterConfig();
            if (!this.jhipsterAppConfig) {
                this.error('Can\'t read .yo-rc.json');
            }
        },
        displayLogo() {
            if (this.isValid) {
                this.log(`${chalk.white('Running')} ${chalk.bold('JHipster Multitenacy:entity')} ${chalk.white('Generator!')}\n`);
            }
        },
        validate() {
            if (this.config.get('tenantName') === undefined) {
                this.env.error(`${chalk.red.bold('ERROR!')} Please run the Multitenancy generator first`);
            }
        }
    },
    prompting() {
        if (this.isValid) {
            const done = this.async();
            this.prompt([
                {
                    when: this.options.name === undefined && this.skipPrompt === false,
                    type: 'confirm',
                    name: 'continue',
                    message: 'Do you want to make an entity tenant aware?'
                },
                {
                    when: this.options.name !== undefined && this.skipPrompt === false,
                    type: 'confirm',
                    name: 'continue',
                    message: `Do you want to make ${this.options.name} tenant aware?`
                },
                {
                    when: p => p.continue === true && this.options.name === undefined,
                    type: 'input',
                    name: 'entity',
                    message: 'Name the entity you wish to make tenant aware.'
                }
            ]).then((props) => {
                if (this.options.name === undefined) {
                    this.options.name = props.entity;
                }
                if (this.skipPrompt) {
                    this.options.continue = true;
                } else {
                    this.options.continue = props.continue;
                }
                done();
            });
        }
    },
    writing: {
        editJSON() {
            if (this.isValid) {
                if (this.options.continue === true) {
                    // if entity does exisit we should have the entity json
                    this.entityJson = this.getEntityJson(this.options.name);

                    if (this.entityJson === undefined) {
                        // if not generated it
                        this.error(chalk.yellow(`Entity ${chalk.bold(this.options.name)} doesn't exist. Please generate using yo jhipster:entity ${this.options.name}`));
                    } else {
                        // check if entity has relationship already
                        this.entities = this.config.get('tenantisedEntities');
                        if (this.entities !== undefined && this.entities.indexOf(_.toLower(this.options.name)) >= 0) {
                            this.isValid = false;
                            this.log(chalk.yellow(`Entity ${chalk.bold(this.options.name)} has been tenantised`));
                        }
                        if (this.isValid) {
                            // get entity json config
                            this.tenantName = this.config.get('tenantName');
                            this.relationships = this.entityJson.relationships;
                            // if any relationship exisits already in the entity to the tenant remove it and regenerated
                            for (let i = this.relationships.length - 1; i >= 0; i--) {
                                if (this.relationships[i].otherEntityName === this.tenantName) {
                                    this.relationships.splice(i);
                                }
                            }

                            this.log(chalk.white(`Entity ${chalk.bold(this.options.name)} found. Adding relationship`));
                            this.real = {
                                relationshipName: this.tenantName,
                                otherEntityName: this.tenantName,
                                relationshipType: 'many-to-one',
                                otherEntityField: 'id',
                                ownerSide: true,
                                otherEntityRelationshipName: this.options.name
                            };
                            this.relationships.push(this.real);
                            this.entityJson.relationships = this.relationships;

                            if (this.entityJson.service === 'no') {
                                this.entityJson.service = 'serviceClass';
                            }

                            this.fs.writeJSON(`.jhipster/${_.upperFirst(this.options.name)}.json`, this.entityJson, null, 4);

                            if (this.entities === undefined) {
                                this.tenantisedEntities = [_.toLower(this.options.name)];
                            } else {
                                this.entities.push(_.toLower(this.options.name));
                                this.tenantisedEntities = this.entities;
                            }
                        }
                    }
                } else {
                    this.isValid = false;
                    this.log(chalk.yellow('Exiting sub generator'));
                }
            }
        },
        addEntityToAspect() {
            if (this.isValid) {
                // read app config from .yo-rc.json
                mtUtils.readConfig(this.jhipsterAppConfig, this);
                let tenantisedEntityServices = `@Before("execution(* ${this.packageName}.service.UserService.*(..))`;
                this.tenantisedEntities.forEach((entity) => {
                    const addEntity = ` || execution(* ${this.packageName}.service.${_.upperFirst(entity)}Service.*(..))`;
                    tenantisedEntityServices = tenantisedEntityServices.concat(addEntity);
                });
                tenantisedEntityServices = tenantisedEntityServices.concat('")');
                this.tenantisedEntityServices = tenantisedEntityServices;
                // replace aspect

                /* tenant variables */
                mtUtils.tenantVariables(this.tenantName, this);
                const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
                this.template('_TenantAspect.java', `${javaDir}aop/${this.tenantNameLowerFirst}/${this.tenantNameUpperFirst}Aspect.java`);

                const entityName = _.kebabCase(_.lowerFirst(this.options.name));
                this.entityNameUpperFirst = _.upperFirst(entityName);
                this.entityNameLowerFirst = _.lowerFirst(entityName);
                this.template('_EntityAspect.java', `${javaDir}aop/${this.tenantNameLowerFirst}/${this.entityNameUpperFirst}Aspect.java`);

            }
        },
        generateClientCode() {
            if (this.isValid) {
                const tenantNameUpperFirst = _.upperFirst(this.config.get('tenantName'));
                const tenantNameLowerFirst = _.lowerFirst(this.config.get('tenantName'));
                const tenantNamePluralLowerFirst = pluralize(_.lowerFirst(this.config.get('tenantName')));
                const webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;
                const clientTestDir = jhipsterConstants.CLIENT_TEST_SRC_DIR;
                const entityName = _.kebabCase(_.lowerFirst(this.options.name));
                const entityNameUpperFirst = _.upperFirst(entityName);
                const entityNamePlural = pluralize(entityName);
                const entityNamePluralUpperFirst = _.upperFirst(entityNamePlural);
                const protractorTests = this.testFrameworks.indexOf('protractor') !== -1;

                this.options.entityNameLowerFirst = _.kebabCase(_.lowerFirst(this.options.name));

                this.rewriteFile(
                    `${webappDir}app/entities/${entityName}/${entityName}-detail.component.html`,
                    '</dl>',
                    partialFiles.angular.entityDetailCompHtml(this)
                );

                this.replaceContent(
                    `${webappDir}app/entities/${entityName}/${entityName}-update.component.html`,
                    '<button type="button" id="cancel-save" class="btn btn-secondary"  (click)="previousState()">',
                    partialFiles.angular.entityUpdateCompHtml(this),
                    false
                );

                // entity-update.component.ts
                this.rewriteFile(
                    `${webappDir}app/entities/${entityName}/${entityName}-update.component.ts`,
                    'import { Observable } from \'rxjs\';',
                    partialFiles.angular.entityUpdateCompTsImports(this)
                );

                this.rewriteFile(
                    `${webappDir}app/entities/${entityName}/${entityName}-update.component.ts`,
                    'isSaving: boolean;',
                    `${tenantNamePluralLowerFirst}: ${tenantNameUpperFirst}[];
    currentAccount: any;`
                );

                this.replaceContent(
                    `${webappDir}app/entities/${entityName}/${entityName}-update.component.ts`,
                    'protected activatedRoute: ActivatedRoute) {}',
                    partialFiles.angular.entityUpdateCompTsConstr(this),
                    false
                );

                this.replaceContent(
                    `${webappDir}app/entities/${entityName}/${entityName}-update.component.ts`,
                    'ngOnInit() {',
                    partialFiles.angular.entityUpdateCompTsOnInit(this),
                    false
                );

                this.rewriteFile(
                    `${webappDir}app/entities/${entityName}/${entityName}-update.component.ts`,
                    `if (this.${_.lowerFirst(this.options.name)}.id !== undefined) {`,
                    `if (this.currentAccount.${tenantNameLowerFirst}) {
            this.${entityName}.${tenantNameLowerFirst} = this.currentAccount.${tenantNameLowerFirst};
        }`
                );
                //----------------

                let th = '';
                if (this.enableTranslation) {
                    th = `<th *ngIf="!currentAccount.${tenantNameLowerFirst}"><span jhiTranslate="userManagement${tenantNameUpperFirst}">${tenantNameUpperFirst}</span></th>`;
                } else {
                    th = `<th *ngIf="!currentAccount.${tenantNameLowerFirst}"><span>${tenantNameUpperFirst}</span></th>`;
                }
                this.rewriteFile(
                    `${webappDir}app/entities/${entityName}/${entityName}.component.html`,
                    '<th></th>',
                    th
                );

                this.rewriteFile(
                    `${webappDir}app/entities/${entityName}/${entityName}.component.html`,
                    '<td class="text-right">',
                    `<td *ngIf="!currentAccount.${tenantNameLowerFirst}">
                    <div *ngIf="${this.options.entityNameLowerFirst}.${tenantNameLowerFirst}">
                        <a [routerLink]="['/admin/${tenantNameLowerFirst}-management', ${this.options.entityNameLowerFirst}.${tenantNameLowerFirst}?.id, 'view' ]" >{{${this.options.entityNameLowerFirst}.${tenantNameLowerFirst}?.name}}</a>
                    </div>
                </td>`
                );

                this.rewriteFile(
                    `${webappDir}app/shared/model/${entityName}.model.ts`,
                    `export interface I${entityNameUpperFirst} {`,
                    `import { ${tenantNameUpperFirst} } from '../../admin/${tenantNameLowerFirst}-management/${tenantNameLowerFirst}.model';`
                );

                this.rewriteFile(
                    `${webappDir}app/shared/model/${entityName}.model.ts`,
                    'name?: string;',
                    `${tenantNameLowerFirst}?: ${tenantNameUpperFirst};`
                );

                // e2e test
                if (protractorTests) {
                    this.rewriteFile(
                        `${clientTestDir}e2e/admin/${tenantNameLowerFirst}-management.spec.ts`,
                        'clickOnCreateButton() {',
                        partialFiles.angular.tenantMgmtSpecTs(this)
                    );

                    this.rewriteFile(
                        `${clientTestDir}e2e/entities/${entityName}/${entityName}.spec.ts`,
                        `describe('${entityNameUpperFirst} e2e test', () => {`,
                        `import { ${tenantNameUpperFirst}MgmtComponentsPage } from '../../admin/${tenantNameLowerFirst}-management.spec';
`
                    );

                    this.rewriteFile(
                        `${clientTestDir}e2e/entities/${entityName}/${entityName}.spec.ts`,
                        `let ${entityName}ComponentsPage: ${entityNameUpperFirst}ComponentsPage;`,
                        `let ${tenantNameLowerFirst}MgmtComponentsPage: ${tenantNameUpperFirst}MgmtComponentsPage;`
                    );

                    this.replaceContent(
                        `${clientTestDir}e2e/entities/${entityName}/${entityName}.spec.ts`,
                        `it('should create and save ${entityNamePluralUpperFirst}', () => {`,
                        partialFiles.angular.entitySpecTs1(this)
                    );

                    this.rewriteFile(
                        `${clientTestDir}e2e/entities/${entityName}/${entityName}.spec.ts`,
                        `${entityName}UpdatePage.save();`,
                        `${entityName}UpdatePage.set${tenantNameUpperFirst}();`
                    );

                    this.rewriteFile(
                        `${clientTestDir}e2e/entities/${entityName}/${entityName}.page-object.ts`,
                        'getPageTitle() {',
                        `${tenantNameLowerFirst}Select = element(by.css('select'));`
                    );

                    this.replaceContent(
                        `${clientTestDir}e2e/entities/${entityName}/${entityName}.page-object.ts`,
                        '} from \'protractor\';',
                        ', protractor } from \'protractor\';'
                    );

                    this.rewriteFile(
                        `${clientTestDir}e2e/entities/${entityName}/${entityName}.page-object.ts`,
                        'save(): promise.Promise<void> {',
                        partialFiles.angular.entitySpecTs2(this)
                    );
                }

                // i18n
                if (this.enableTranslation) {
                    this.getAllInstalledLanguages().forEach((language) => {
                        this.rewriteFile(
                            `${webappDir}i18n/${language}/${entityName}.json`,
                            '"detail": {',
                            `"${tenantNameLowerFirst}": "${tenantNameUpperFirst}",`
                        );
                    });
                }
            }
        }
    },
    install() {
        if (this.options.name !== undefined && this.isValid) {
            // regenerate the tenant-ised entity
            this.composeWith(require.resolve('generator-jhipster/generators/entity'), {
                regenerate: true,
                'skip-install': true,
                'skip-client': true,
                'skip-server': false,
                'no-fluent-methods': false,
                'skip-user-management': false,
                arguments: [this.options.name],
            });
            this.config.set('tenantisedEntities', this.tenantisedEntities);
        }
    },
    end() {
    }
});
