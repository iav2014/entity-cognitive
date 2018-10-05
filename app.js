const config = require('./config/config');
const co = require('co');
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const app = express();
let key = fs.readFileSync(__dirname + '/cert/server.key'); // your server.key && pem files
let cert = fs.readFileSync(__dirname + '/cert/server.pem');
let https_options = {
	key: key,
	cert: cert
};
const http = require('http').Server(app);
const https = require('https').Server(https_options, app);
const io = require('socket.io')(https, {'pingInterval': 2000, 'pingTimeout': 14000}); //socker timeout
const wrap = require('co-express');
const compression = require('compression');

const search = require('./api/core-ask.js');
const skills = require('./rules/rules.js');
const settingsApi = require('./api/settings.js');
const usersApi = require('./api/users.js');
const cookieParser = require('cookie-parser');
global.auth = require('./authentication');
const Database = require('./databases');

var logger = require('./lib/logger/logger').logger(__filename);
var log4js = require('log4js');
var theAppLog = log4js.getLogger();
var theHTTPLog = morgan(':remote-addr - :method :url HTTP/:http-version :status :res[content-length] - :response-time ms', {
	'stream': {
		write: function (str) {
			theAppLog.debug(str);
		}
	}
});

app.use(compression({
	threshold: 0,
	level: 9,
	memLevel: 9
}));

app.use((req, res, next) => {
	req.connection.setNoDelay(true);
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'X-Requested-With');
	next()
});

app.use(cookieParser());

// api not in rest format...
app.get('/api/status', wrap(function* (req, res) {
	res.json({status: 200, msg: 'OK'})
}));
app.use(theHTTPLog);
app.use('/', [global.auth.filter(true), express.static('./src')]);
app.use('/api/settings', [global.auth.filter(false), settingsApi]);
app.use('/api/users', [global.auth.filter(false), usersApi]);
app.get('/api/user', global.auth.filter(false), wrap(function* (req, res) {
	res.json(req.user);
}));
app.get('/api/token', global.auth.filter(false), wrap(function* (req, res) {
	res.json(req.token);
}));
app.get('/api/status', global.auth.filter(false), wrap(function* (req, res) {
	res.json({status: 200, msg: 'OK'});
}));

// TODO parse services in query
app.get('/api/ask', global.auth.filter(false), wrap(function* (req, res) {
	const input = req.query.q.toLowerCase();
	try {
		const result = yield search.query(input, req.user, req.token);
		res.json(result);
	} catch (e) {
		console.log(e);
		res.json({msg: {text: 'Sorry, I didn\'t understand ' + input}, type: 'error'});
	}
}));

app.get('/api/login', global.auth.login);
app.get('/api/logout/:user?', [global.auth.filter(false), global.auth.logout]);
app.get('/api/tokens/:user?', [global.auth.filter(false), global.auth.viewTokens]);
app.get('/api/validate', [global.auth.filter(false), global.auth.validate]);
io.use(global.auth.verifyIO);

io.on('connect', socket => {
	co(function* () {
		logger.debug('socket.io connected');
		socket.on('ask', co.wrap(function* (msg) {
			try {
				logger.debug('speaker:' + JSON.stringify(msg));
				const result = yield search.query(msg, socket.user, socket.token);
				console.log('response', result);
				socket.emit('response', result);
			} catch (e) {
				logger.error(JSON.stringify(e));
				socket.emit('response', {msg: {text: 'Sorry, I didn\'t understand ' + msg.text.toLowerCase()}, type: 'error'});
			}
		}));
		yield skills.registerClient(socket, socket.user)
	}).catch(err => {
		logger.error(JSON.stringify(err))
	})
});

function* initialSetup() {
	if ((yield global.db.getGlobalValue('port')) == null) {
		logger.debug('Setting default global values in database');
		yield global.db.setGlobalValue('port', config.app.https);
		yield global.db.setGlobalValue('promiscuous_mode', true);
		yield global.db.setGlobalValue('promiscuous_admins', true);
	}
}

co(function* () {
	logger.debug('Setting up database.');
	global.db = yield Database.setup();
	yield initialSetup();
	
	global.sendToUser = function (user, type, message) {
		const sockets = global.auth.getSocketsByUser(user);
		sockets.map(socket => {
			socket.emit(type, message)
		})
	};
	global.sendToDevice = function (token, type, message) {
		const socket = global.auth.getSocketByToken(token);
		if (socket) {
			socket.emit(type, message)
		} else {
			
			logger.error("Failed to send to device: " + JSON.stringify(token));
		}
	};
	
	logger.debug('Loading skills.');
	yield skills.loadSkills()
	logger.debug('Training recognizer.');
	yield search.train_recognizer(skills.getSkills());
	logger.debug('Starting server...');
	const port = yield global.db.getGlobalValue('port');
	console.log(port);
	/* if you want to access by http... uncomment this lines but it doesnt work access outside localhost
	http.listen(config.app.http, () => {
		logger.debug(`Server started on http://localhost:${config.app.http}`)
	});
	*/
	// it is neccesary publish under https, due use google chrome web speech api...
	https.listen(config.app.https, () => {
		logger.debug(`Server started on https://localhost:${config.app.https}`)
	});
	
	const promiscuous = yield global.db.getGlobalValue('promiscuous_mode')
	const promiscuous_admins = yield global.db.getGlobalValue('promiscuous_admins')
	if (promiscuous) {
		logger.debug('Warning! Promiscuous mode is enabled all logins will succeed.')
		if (promiscuous_admins) {
			logger.debug('Possibly deadly warning! Promiscuous admins is enabled.' +
				' All new users will be admins and can view each others data.')
		}
		logger.debug(`Settings can be changed at https://localhost:${config.app.https}/settings.html`)
	}
}).catch(err => {
	console.log(err)
	throw err
});
