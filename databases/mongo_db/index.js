// TODO all mongodb interface generators based

const co = require('co')
const fs = require('fs');
const mongo = require('mongodb');
let ObjectId = require("mongodb").ObjectId;
const logger = require('../../lib/logger/logger').logger(__filename);

function makeConditionalQuery(query, conditions, values) {
	const endConditions = []
	const endValues = []
	for (let i = 0; i < conditions.length; i++) {
		if (values[i] != undefined && values[i] != null) {
			endConditions.push(conditions[i])
			endValues.push(values[i])
		}
	}
	for (let i = 0; i < endConditions.length; i++) {
		if (i == 0) {
			query = `${query} WHERE ${endConditions[i]}`
		} else {
			query = `${query} AND ${endConditions[i]}`
		}
	}
	return {query: query, values: endValues}
}

function exportUser(user) {
	if (user) {
		return {
			user_id: user.user_id,
			username: user.username,
			is_admin: user.is_admin == 1
		}
	}
	return null
}

function mapKey(results) {
	if (results) {
		if (Array.isArray(results)) {
			for (let i = 0; i < results.length; i++) {
				results[i].key = results[i].name
				results[i].name = undefined
			}
		} else {
			results.key = results.name
			results.name = undefined
		}
	}
}

function Database() {
	this.db = null
}

Database.prototype.loadDefaultSql = function* () {
	return new Promise((resolve, reject) => {
		fs.readFile('./db/mysql_db/database.sql', 'utf8', function (err, data) {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
};

Database.prototype.query = function* (collection,operation, values, multiple) {
	return new Promise((resolve, reject) => {
		try {
			console.log('collection:',collection);
			console.log('operation:',operation);
			console.log('values:',values);
			console.log('multiple:',multiple);
			const $this = this;
			let json={$set:{[values[0]]:values[1]}};
			if(collection=='global_settings' && operation=='update')
			$this.db.collection(collection, (err, coll) => {
				if(!err){
					var js={[values[0]]:values[0]};
					console.log(js);
					coll.find({}).toArray(function(err,result){
						if(!err){
							result[0].port=values[1];
							console.log(result[0]);
							coll.update({_id:ObjectId(result[0]._id)}, json,(err, result) => {
								if(!err){
									//console.log('*query[update]:',result);
									console.log('update:',values);
									resolve(result);
								} else {
									reject(err)
								}
								
							});
						}
					})
				} else {
					reject(err)
				}
				
				
			});
			/*
			this.db.query(query, values, function (error, results, fields) {
				if (error) {
					reject(new Error(`Error running query: ${query} - ${JSON.stringify(values)}: ${error}`));
				} else {
					if (Array.isArray(results)) {
						if (!multiple) {
							if (results.length == 0) {
								resolve(null);
							} else if (results.length == 1) {
								resolve(results[0])
							} else {
								reject(`Singular query returned multiple results. query:${query}`)
							}
						} else {
							resolve(results);
						}
					} else {
						resolve(results);
					}
				}
			});
			*/
		} catch (err) {
			reject(err)
		}
	});
};


Database.prototype.allQueryWrapper = function* (query, values, key) {
	const rows = yield this.query(query, values, true)
	if (Array.isArray(rows) && rows.length > 0) {
		rows.map((row) => {
			row.value = JSON.parse(row.value)
		})
		if (key) {
			return rows[0].value
		} else {
			return rows
		}
	}
	return undefined
}

Database.prototype.getVersion = function* () {
	//const row = yield this.query('SELECT * FROM version ORDER BY version DESC LIMIT 1')
	//return row.version
	const $this = this;
	$this.db.collection('version', (err, coll) => {
		coll.find({}, {fields:{_id:0}}).sort({version:-1}).limit(1).toArray((err, result) => {
			console.log('*',result[0].version);
			return (result);
		});
	});
}

Database.prototype.setVersion = function* (version) {
	yield this.query('REPLACE INTO version(version) VALUES (?)', [version])
	// mongo equivalent
	
}

Database.prototype.close = function* () {
	const $this = this;
	return new Promise((resolve, reject) => {
		$this.db.end();
		resolve();
	});
}

Database.prototype.saveUser = function* (user) {
	// Only update an existing user if the user_id is specified. Technically we could also use the unique username
	// but that's likely to cause unpredictable behaviour when updating usernames.
	const dbuser = yield this.getUser({user_id: user.user_id})
	if (dbuser) {
		const updated = {
			user_id: dbuser.user_id,
			username: user.username ? user.username : dbuser.username,
			password: user.password ? user.password : dbuser.password,
			is_admin: (user.is_admin === true || user.is_admin === false) ? (user.is_admin ? 1 : 0) : dbuser.is_admin
		}
		yield this.query('UPDATE users SET username=?,password=?,is_admin=? WHERE user_id=?', [updated.username, updated.password, updated.is_admin, dbuser.user_id])
	} else {
		const is_admin = (user.is_admin === true) ? 1 : 0
		yield this.query('INSERT INTO users(username, password, is_admin) VALUES(?, ?, ?)', [user.username, user.password, is_admin])
	}
}

Database.prototype.deleteUser = function* (user) {
	if (user.user_id) {
		yield this.query('DELETE FROM tokens WHERE user_id = ?', [user.user_id])
		yield this.query('DELETE FROM user_settings WHERE user_id = ?', [user.user_id])
		// This ones a little complicated. First it selects all the queries where the user_id is the current user_id.
		// It then removes any responses where the query_id matches any query_id's in the selected set.
		yield this.query('DELETE FROM responses WHERE responses.query_id IN (SELECT responses.query_id FROM responses INNER JOIN queries ON queries.query_id = responses.query_id WHERE queries.user_id = ?)', [user.user_id])
		yield this.query('DELETE FROM queries WHERE user_id = ?', [user.user_id])
		yield this.query('DELETE FROM users WHERE user_id = ?', [user.user_id])
	}
}

Database.prototype.getUser = function* (user) {
	if (user.user_id == null && user.username == null) {
		return null
	}
	const base = 'SELECT * FROM users'
	const query = makeConditionalQuery(base, ['user_id = ?', 'username = ?', 'password = ?'], [user.user_id, user.username, user.password])
	const dbuser = yield this.query(query.query, query.values)
	return dbuser
}

Database.prototype.getUserForExport = function* (user) {
	return exportUser(yield this.getUser(user))
}

Database.prototype.getUsers = function* () {
	const users = yield this.query('SELECT * FROM users ORDER BY user_id ASC', [], true)
	const parsed = []
	users.map((user) => {
		parsed.push(exportUser(user))
	})
	return parsed
}

Database.prototype.setValue = function* (skill, user, key, value) {
	if (skill && user && key && user.user_id) {
		value = JSON.stringify(value)
		yield this.query('REPLACE INTO user_settings(skill, user_id, name, value) VALUES (?, ?, ?, ?)', [skill, user.user_id, key, value])
	} else {
		throw new Error('skill, user and key must be set')
	}
}

Database.prototype.deleteValue = function* (skill, user, key) {
	yield this.query('DELETE FROM user_settings WHERE skill = ? AND user_id = ? AND name = ?', [skill, user.user_id, key])
}

Database.prototype.getValue = function* (skill, user, key) {
	const base = 'SELECT skill, users.username, name, value FROM user_settings INNER JOIN users ON users.user_id = user_settings.user_id'
	let user_id = (user) ? (user.user_id ? user.user_id : undefined) : undefined
	const query = makeConditionalQuery(base, ['skill = ?', 'user_settings.user_id = ?', 'name = ?'], [skill, user_id, key])
	query.query += ' ORDER BY skill ASC, user_settings.user_id ASC, name ASC'
	const results = yield this.allQueryWrapper(query.query, query.values, key)
	mapKey(results)
	return results
}

Database.prototype.setSkillValue = function* (skill, key, value) {
	if (skill && key) {
		value = JSON.stringify(value)
		yield this.query('REPLACE INTO skill_settings(skill, name, value) VALUES (?, ?, ?)', [skill, key, value])
	} else {
		throw new Error('skill and key must be set')
	}
}

Database.prototype.getSkillValue = function* (skill, key) {
	const base = 'SELECT skill, name, value FROM skill_settings'
	const query = makeConditionalQuery(base, ['skill = ?', 'name = ?'], [skill, key])
	query.query += ' ORDER BY skill ASC, name ASC'
	const results = yield this.allQueryWrapper(query.query, query.values, key)
	mapKey(results)
	return results
}

Database.prototype.deleteSkillValue = function* (skill, key) {
	yield this.query('DELETE FROM skill_settings WHERE skill = ? AND name = ?', [skill, key])
}

Database.prototype.setGlobalValue = function* (key, value) {
	if (key) {
		value = JSON.stringify(value)
		//yield this.query('REPLACE INTO global_settings(name, value) VALUES (?, ?)', [key, value])
		yield this.query('global_settings','update',[key, value])
	
	} else {
		throw new Error('key must be set')
	}
}

Database.prototype.getGlobalValue = function* (key) {
	logger.debug('getGlobalValue:->'+key);
	const $this = this;
	$this.db.collection('global_settings', (err, coll) => {
		coll.find({}, {}).toArray((err, result) => {
			console.log('*',result[0][key]);
			return (result[0][key]);
		});
	});
}
Database.prototype.deleteGlobalValue = function* (key) {
	yield this.query('DELETE FROM global_settings WHERE name = ?', [key])
}

Database.prototype.saveToken = function* (user, token) {
	const dbtokens = yield this.getUserTokens(user, token)
	if (dbtokens.length > 0) {
		yield this.query('UPDATE tokens SET name=? WHERE user_id=? AND token=?', [token.name, user.user_id, token.token])
	} else {
		yield this.query('INSERT INTO tokens(token, user_id, name) VALUES(?, ?, ?)', [token.token, user.user_id, token.name])
	}
}

Database.prototype.deleteToken = function* (token) {
	yield this.query('DELETE FROM tokens WHERE token = ?', [token.token])
}

Database.prototype.deleteUserTokens = function* (user) {
	yield this.query('DELETE FROM tokens WHERE user_id = ?', [user.user_id])
}

Database.prototype.getUserFromToken = function* (token) {
	if (token.token) {
		token = token.token
	}
	const user = yield this.query('SELECT users.* FROM users INNER JOIN tokens ON tokens.user_id=users.user_id WHERE tokens.token = ?', [token])
	return exportUser(user)
}

Database.prototype.getUserTokens = function* (user, token) {
	const parsedToken = {
		token: (token ? token.token : undefined),
		name: ((token && token.token == null) ? token.name : undefined)
	}
	const base = 'SELECT token, timestamp, name FROM tokens'
	const query = makeConditionalQuery(base, ['user_id = ?', 'name = ?', 'token = ?'], [user.user_id, parsedToken.name, parsedToken.token])
	return yield this.query(query.query, query.values, true)
}

Database.prototype.addQuery = function* (query, user, token) {
	if (token == null) {
		token = {token: null}
	}
	query = JSON.stringify(query)
	const results = yield this.query('INSERT INTO queries(query, user_id, token) VALUES(?, ?, ?)', [query, user.user_id, token.token])
	return {query_id: results.insertId, query, user};
}

Database.prototype.addResponse = function* (query, skill, response) {
	response = JSON.stringify(response)
	yield this.query('INSERT INTO responses(query_id, skill, response) VALUES(?, ?, ?)', [query.query_id, skill, response])
}

Database.prototype.getResponses = function* (user, skill, token, timestamp) {
	const base = 'SELECT queries.query, responses.skill, responses.response, queries.timestamp, queries.token FROM responses INNER JOIN queries ON queries.query_id=responses.query_id'
	const query = makeConditionalQuery(base, ['queries.user_id = ?', 'responses.skill = ?', 'queries.token = ?', 'queries.timestamp >= ?'], [user.user_id, skill, token.token, timestamp])
	const rows = yield this.query(query.query, query.values, true)
	if (rows && rows.length > 0) {
		rows.map(row => {
			row.response = JSON.parse(row.response)
			row.query = JSON.parse(row.query)
		})
	}
	return rows
}

Database.prototype.connect = function* (host, username, password, database) {
	
	let target = {
		// @ format mongodb://<dbUser>:<dbPassword>@<host1>:<port1>,<host2>:<port2>/<dbName>?replicaSet=<replicaSetName>
		uri: 'mongodb://localhost:27017,localhost:27018,localhost:27019/' + database + '?w=0&readPreference=secondary&replicaSet=rs0&maxPoolSize=10',
		options: {
			keepAlive: 1,
			connectTimeoutMS: 30000,
			socketTimeoutMS: 0,
			autoReconnect: true,
			useNewUrlParser: true
		}
	};
	const $this = this;
	return new Promise((resolve, reject) => {
		try {
			function connect(callback) {
				
				mongo.connect(target.uri, target.options, (err, db) => {
					if (err) {
						logger.error(JSON.stringify(err));
						callback(err);
					}
					else {
						logger.debug('connected to mongodb:' + JSON.stringify(target.uri));
						
						if (callback) {
							callback();
						}
						$this.db = db.db('entity');
					}
				});
			}
			
			connect(resolve);
		} catch (err) {
			reject(err);
		}
	});
}

function* setup(host, username, password, database) {
	const db = new Database();
	yield db.connect(host, username, password, database);
	logger.debug("mongodb database connected.");
//	const setupQuery = yield db.loadDefaultSql();
//	yield db.query(setupQuery, [], true);
	const version = yield db.getVersion();
	
	switch (version) {
		default:
			break
	}
	
	return db;
}

module.exports = {
	setup
}
