const fs = require('fs');
const path = require('path');
const template = require('../template/template.js');

const createFunction = (name) => {
    saveFunction(name);
    return name
};

const saveFunction = (name) => {
    const filePath = path.join(__dirname, `${name}.js`);
    const content = template(name);
    fs.writeFileSync(filePath, content, 'utf8');
};


module.exports = { createFunction };
