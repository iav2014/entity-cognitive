const intent = () => ({
	keywords: ['open','show','power point'],
	module: 'start'
})

function openPPT(){
	const childProcess = require("child_process");
	childProcess.exec('open -a /Applications/Microsoft\\ PowerPoint.app/Contents/MacOS/Microsoft\\ PowerPoint    /Users/ariza/Desktop/Innovacion\\ everis\\ 2017-2018/formacion/NJS-WS-20180216.pptx');
}
function search(query,text){
	var counter=0;
	for (var i=0; i < text.length; i++)
	{
		if (-1 != query.search(text[i]));
		{
			counter++;
		}
	}
	return counter;
}
function * time_resp(query) {
	console.log('[QUERY:'+query);
	
	var text =['power point','open','workshop','show'];
	var result=search(query,text);
	console.log('result',result);
	if(result>=1){
		openPPT();
	}
	
	
	return {text: 'here is your presentation '}
}

const examples = () => (
	['open presentation', 'begin power point?']
)

module.exports = {
	get: time_resp,
	intent,
	examples
}
