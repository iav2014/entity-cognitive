const google = require('./google')
const duckduckgo = require('./duckduckgo')
//const wolframalpha = require('./wolframalpha')

const not_found_responses = ['Hmmm I dont seem to know ', 'Sorry I couldn\'t understand ', 'My memory banks dont contain ']
//const resp_functs = [google, duckduckgo, wolframalpha]
const resp_functs = [google, duckduckgo];

String.prototype.replaceAll = function (str1, str2, ignore) {
	return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, '\\$&'), (ignore ? 'gi' : 'g')), (typeof (str2) === 'string') ? str2.replace(/\$/g, '$$$$') : str2)
}

const intent = () => ({
	keywords: ['what qqqq', 'who won qqqq', 'who is qqqq', 'where is qqqq', 'when did qqqq',
		'what is qqqq', 'what is qqqq in qqqq', 'whats qqqq', '√ ', '-', '+', '%', '/', '*'],
	module: 'fact'
})

function * fact_resp(query) {
	let fact = null
	
	for (let i = 0; i < resp_functs.length; i++) {
		const response = yield resp_functs[i].get(query)
		console.log('RESPONSE------->',response);
		if (response && response !== '') {
			fact = response
			break
		}
	}
	
	if (!fact) {
		return {text: not_found_responses[Math.floor(Math.random() * not_found_responses.length)] + query}
	}
	
	if (fact.includes('|') && fact.includes('name') && fact.includes('location')){
		let tokenized_fact = fact.split('|')
		fact = 'You are in '+tokenized_fact[tokenized_fact.length-1].trim()
	}
	
	return {text: fact}
}

const examples = () => (
	['What color is the sky?', 'When is season 7 of Game Of Thrones?', 'Where is Paris?', 'What is 200 Pounds in Euro?',
		'What\'s 2+2?', 'What is 3/4', 'what is two plus two']
)

module.exports = {
	get: fact_resp,
	intent,
	examples
}