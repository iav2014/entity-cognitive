const co = require('co');
const intent = () => ({
	keywords: ['can you introduce', 'introduce yourself'],
	module: 'introduceyourself'
});
function * getName(user) {
	try {
		const nametmp = yield global.db.getValue('name', user, 'name')
		if (nametmp) {
			return nametmp
		}
	} catch (err) {
		// Ignore and use the default name.
	}
	return DEFAULT_NAME
}

function * introduce_resp(query,braeakdown,user) {
	let name = yield getName(user);
	var result = 'Yes, you are speaking to '+name+'.\n I am a virtual cognitive system.  I Have been made in node js by Nacho Ariza in 2018.\n'+
		' I am very pleased to help humans to get thinks.\n' +
		' I am delighted to help humans in their day-to-day work';
	
	
	return {text: result}
}

const examples = () => (
	['can you introduce yourself?']
)

module.exports = {
	get: introduce_resp,
	intent,
	examples
}