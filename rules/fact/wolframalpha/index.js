const request = require('co-request')
const wolfram = require('wolfram-alpha')
const co = require('co')

let client = null;
//U7L4VR-K3WJPLK6Y2
//my API RYYGE5-VE2YJLH8RG
co(function * () {
    console.log('wolfram-alpha','RYYGE5-VE2YJLH8RG');
    if ((yield global.db.getSkillValue('fact', 'wolframalpha')) == null) {
        console.log('Setting default API key for Wolfram Alpha')
        yield global.db.setSkillValue('fact', 'wolframalpha', 'URYYGE5-VE2YJLH8RG')
    }
    client = wolfram.createClient(yield global.db.getSkillValue('fact', 'wolframalpha'))
}).catch(err => {
    console.log(err)
    throw err
})

function * wlfra_resp(query) {
    try {
        const result = yield(client.query(query))
        for (let i = 0; i < result.length; i++) {
            if (result[i].primary) {
                return result[i].subpods[0].text
            }
        }
        return "I'm sorry, I didn't understand that."
    } catch (err) {
        console.log(err)
        return "I'm sorry, I didn't understand that."
    }
}

module.exports = {
    get: wlfra_resp
}
