#! /usr/bin/env node

'use strict';

const
	program = require('commander'),
	chalk = require('chalk'),	
	rackspace = require('./lib/rackspace.js'),
	parser = require('./lib/csv-parser.js'),
	async = require('async'),
	sleep = require('sleep'),
	http = require('http');

program
	.version('1.0.0')
	.description('NodeJS tool to create multiple rackspace mailboxes from a flat csv file');

let mainFunction = (accountNumber, domain, filename, options) => {

	// Args checkin
	if (typeof options.userkey === 'undefined' | typeof options.secretkey === 'undefined') {
	   console.error(chalk.bold.red('You must specify --userkey and --secretkey options !'));
	   program.outputHelp();
	   process.exit(1);
	}

	// Preambule
	rackspace.setKeys(options.userkey, options.secretkey);
	rackspace.setAccount(accountNumber, domain);
	rackspace.getStats(accountNumber, domain);

	var entries = parser.getProcessedData(filename);

	async.everyLimit(entries, 1, (item, callback) => {
		console.log('Processing entry %s', item.Username);

		rackspace.getMailbox(item.Username, (mailbox) => {
			if(mailbox.itemNotFoundFault) {
				
				// Mailbox does not exist

				rackspace.createMailbox(item, () => {
					callback(null, mailbox)
				});

			} else {
				
				//Mailbox already exists and we don't overwrite

				console.log(chalk.gray('Mailbox %s already exists (not overwriting)'), item.Username);
				mailbox.result = 'ignored';
				callback(null, mailbox);
			}
		});

		//FIXME: found a graceful way to throttle requests
		sleep.sleep(1);
	}, (err, result) => {
		//console.log(result);
	});
}

program
	.arguments('<accountNumber>', 'Customer account number')
	.arguments('<domain>', 'Domain')
	.arguments('<filename>', 'Csv source file')
	.option('-u, --userkey <userkey>', 'User Key')
	.option('-s, --secretkey <secretkey>', 'Secret Key')
	.action(mainFunction)
	.parse(process.argv);

if (!program.args || program.args.length === 0)
	program.help();
