module.exports = {
	version: '1.0',
	app: {
		host: '0.0.0.0',
		https: 3443,
		http: 3000
	},
	rest: {
		path: '/ws4/'
	},
	logger: {
		levels: {
			default: 'DEBUG',
		},
		appenders: [
			{
				category: '[all]',
				type: 'console',
				layout: {
					type: 'pattern',
					pattern: '%d{yyyy-MM-ddThh:mm:ssO}|%[%p%]|%m',
				},
			},
		],
		replaceConsole: false,
	}
};