const logger = require('../../lib/logger/logger').logger(__filename);
const intent = () => ({
	keywords: ['something to me', 'any task for me'],
	module: 'task'
});

function * task(query) {
	// switch(pending_task){
	// case: ...
	// ..
	logger.debug(query);
	return {text: 'No, I do not have nothing for you. But, you have something to me?'};
}

const examples = () => (
	['Do you have something for me?', 'Do you have any task for me?']
);

module.exports = {
	get: task,
	intent,
	examples
};