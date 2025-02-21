const { faker } = require("@faker-js/faker");

function generateGadgetCodename() {
    const adjective = faker.word.adjective();
    const noun = faker.word.noun();
    return `${adjective.charAt(0).toUpperCase() + adjective.slice(1)} ${noun.charAt(0).toUpperCase() + noun.slice(1)}`;
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = { 
    generateGadgetCodename,
    getRandomInt
};
