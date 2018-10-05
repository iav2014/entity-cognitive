const intent = () => ({
	keywords: ['where you work', 'where can you work'],
	module: 'canwoywork'
});


function * _resp(query) {
	var result = 'I can come to your office or I can work remotely.  I can work from cloud.  I am always available am realy to help your customers';
	
	
	return {text: result}
}

const examples = () => (
	['where can you work?']
)

module.exports = {
	get: _resp,
	intent,
	examples
}