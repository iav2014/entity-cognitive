const intent = () => ({
	keywords: ['what day is it', 'what is the day'],
	module: 'day'
});

function * time_resp(query) {
	
	var dateobj = new Date();
	function pad(n) {return n < 10 ? "0"+n : n;}
	var result = pad(dateobj.getDate())+"/"+pad(dateobj.getMonth()+1)+"/"+dateobj.getFullYear();
	
	const day = new Date().toLocaleDateString('en-GB', {
		month: 'numeric',
		day: 'numeric'
	})
	console.log(result);
	return {text: 'It is ' + result}
}

const examples = () => (
	['What day is it?', 'What\'s the current day?', 'Tell me the day.']
);

module.exports = {
	get: time_resp,
	intent,
	examples
};