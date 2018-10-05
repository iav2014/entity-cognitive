var logger = require('./lib/logger/logger').logger(__filename);
global.db = require('./sqlite_db')
const auth = require('./authentication')
const co = require('co');
if (process.argv.length < 4) {
	logger.debug('Adds a user to the database or updates the password if they exist.');
	logger.debug('Usage: password.js <username> <password> <is_admin(true/false)>');
} else {
	co(function* () {
		logger.debug('Setting up database.');
		yield global.db.setup('ecs.db');
		let is_admin = 0;
		if (process.argv[4]) {
			is_admin = process.argv[4] == 'true';
		}
		const user = {
			username: process.argv[2],
			password: yield auth.encryptPassword(process.argv[3]),
			is_admin: is_admin
		}
		logger.debug(user);
		yield global.db.saveUser(user);
		logger.debug('User saved');
	}).catch(err => {
		logger.error(err);
		throw err
	})
}

