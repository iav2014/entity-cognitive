var logger = require('../lib/logger/logger').logger(__filename);
let Config = null
try {
	Config = require('./config.json')
} catch (err) {
	logger.debug('Using default SQLite database provider');
	Config = require('./sqlite_db/config.json')
	//logger.debug('Using default mongodb database provider')
	
	//Config = require('./mongo_db/config.json')
}

if (Config.databaseType == 'sqlite') {
	module.exports = {
		setup: function* (args) {
			if (args && args.file) {
				Config.databaseArguments.file = args.file;
			}
			const Database = require('./sqlite_db')
			return yield Database.setup(Config.databaseArguments.file)
		}
	}
} else if (Config.databaseType == 'mysql') {
	module.exports = {
		setup: function* () {
			const Database = require('./mysql_db')
			return yield Database.setup(Config.databaseArguments.host,
				Config.databaseArguments.username,
				Config.databaseArguments.password,
				Config.databaseArguments.database)
		}
	}
} else if (Config.databaseType == 'mongodb') {
	module.exports = {
		setup: function* () {
			const Database = require('./mongo_db')
			return yield Database.setup(Config.databaseArguments.host,
				Config.databaseArguments.username,
				Config.databaseArguments.password,
				Config.databaseArguments.database)
		}
	}
}
