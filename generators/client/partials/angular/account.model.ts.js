const file = context => `${context.webappDir}app/core/user/account.model.ts`;

const tmpls = [
    {
        type: 'rewriteFile',
        target: context => 'public imageUrl: string',
        tmpl: context => `public ${context.tenantNameLowerFirst}: string,`
    }
];

module.exports = {
    file,
    tmpls
};
