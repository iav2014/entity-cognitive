process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // for auto-generate certificates
var request = require('sync-request');
const intent = () => ({
	keywords: ['translate'],
	module: 'translate'
});

/**
 * translate
 * @goal translate message using google translate
 * @param msg,(from)source language,(to) target language  & callback
 * @return callback array response
 * (c) Nacho Ariza november 2017
 * @private
 */
function translate(msg) {
	var _gtUrl = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=it&tl=' + msg.ca + '&sl=' + 'en' + '&dt=t&q=' + msg.msg;
	console.log('to_translate:' + _gtUrl);
	let res = request('GET', _gtUrl, '');
	let body = res.getBody().toString('utf8');
	try {
		let _arrayResponse = JSON.parse(body);
		console.log('translated', _arrayResponse[0][0][0]);
		console.log('origin', _arrayResponse[0][0][1]);
		return {status: true, array: _arrayResponse};
	} catch (err) {
		
		return {status: false, array: 'sorry,I cant translate in this moment!'};
	}
}

var pat1 = /can you translate to (japan|japanish|french|german|spanish|russian) ([a-z' ]+)/i
var pat2 = /can you translate ([a-z' ]+) to (japan|japanish|french|german|spanish|russian)/i

function extractText(text) {
	let resp = {}
	let m = text.match(pat1);
	if (m == null) {
		m = text.match(pat2)
		if (m == null) {
			return null;
		}
		resp.msg = m[1];
		resp.lang = m[2];
	}
	else {
		resp.msg = m[2];
		resp.lang = m[1];
	}
	switch (resp.lang) {
		case 'japan':
		case 'japanish':
			resp.lang='ja-JP';
			resp.ca='ja';
			resp.n=19;
			break;
		case 'french':
			resp.lang='fr-CA';
			resp.ca='fr';
			resp.n=53;
			break;
		case 'german':
			resp.lang='de-DE';
			resp.ca='de';
			resp.n=5;
			break;
		case 'spanish':
			resp.lang='es-ES';
			resp.ca='es';
			resp.n=0;
			break;
		case 'russian':
			resp.lang='ru-RU';
			resp.ca='ru';
			resp.n=28;
			break;
		default:
			break;
	}
	return resp;
}

function* time_resp(query) {
	console.log(query);
	let text = extractText(query);
	console.log('->', text);
	let frame = translate(text);
	if (frame.status) {
		return {text: {lang: text.lang,n:text.n, msg: frame.array[0][0][0]}};
	} else {
		return {text: frame.array};
	}
}

const examples = () => (
	['can you translate hello world to japan?']
);

module.exports = {
	get: time_resp,
	intent,
	examples
}