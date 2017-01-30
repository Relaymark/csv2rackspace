#! /usr/bin/env node

'use strict';

const
	program = require('commander'),
	chalk = require('chalk'),
	rackspace = require('./lib/rackspace.js'),
	parser = require('./lib/csv-parser.js'),
	config = require('./lib/config.js'),
	async = require('async'),
	sleep = require('sleep'),
	http = require('http'),
	ProgressBar = require('progress');

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

	// Set Config
	config.verbose == options.verbose;

	// Preambule
	rackspace.setKeys(options.userkey, options.secretkey);
	rackspace.setAccount(accountNumber, domain);
	//rackspace.getStats(accountNumber, domain);

	var entries = parser.getProcessedData(filename);

	var bar = new ProgressBar('  Processing :current/:total [:bar] :percent Eta: :etas', {
	    complete: '=',
	    incomplete: ' ',
	    width: 20,
	    total: entries.length
  	});

	async.everyLimit(entries, 1, (item, callback) => {
		if(options.verbose)
			console.log('Processing entry %s', item.Username);


		rackspace.getMailbox(item.Username, (mailbox) => {
			if(options.delete){
				if(!mailbox){
						rackspace.deleteMailBox(item.Username, (result) => {
							callback(null, mailbox);
						});
				}
				else {
					console.error(item.Username +' not found');
          callback(null, mailbox);
        }
			}
			else {
				if(mailbox.itemNotFoundFault) {

				// Mailbox does not exist

				rackspace.createMailbox(item, () => {
					callback(null, mailbox)
				});

			} else {
					//Mailbox already exists and we don't overwrite

					if(options.force) {

						rackspace.updateMailbox(item, () => {
							callback(null, mailbox)
						});

					} else {

						if(options.verbose)
							console.log(chalk.gray('  Mailbox %s already exists (not overwriting)'), item.Username);

						mailbox.result = 'ignored';
						callback(null, mailbox);
					}
				}
			}
		});

		//FIXME: found a graceful way to throttle requests
		sleep.sleep(1);
		bar.tick();
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
	.option('-v, --verbose', 'Verbose mode')
	.option('-F, --force', 'Overwrite existing mailboxes')
	.option('-d, --delete', 'Delete maibox')
	.action(mainFunction)
	.parse(process.argv);

if (!program.args || program.args.length === 0)
	program.help();
