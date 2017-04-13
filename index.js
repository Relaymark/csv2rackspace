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
	ProgressBar = require('progress'),
	moment = require('moment');

program
	.version('2.0.0')
	.description('NodeJS tool to create-show-delete multiple rackspace mailboxes from a flat csv file. \r\n'
		+'  You must specify --userkey and --secretkey options to use this.  \r\n'
		+'  You also need to specify --csv option for creating, deleting or showing details of rackspace email accounts.'
		+'  By default, it will list all rackspace email account.');

let mainFunction = (accountNumber, domain,  options) => {
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

	if(options.add || options.delete || options.find){
		if (typeof options.csv === 'undefined' | options.csv === '') {
			console.error(chalk.bold.red('You must specify --csv <filename>  '));
			program.outputHelp();
			process.exit(1);
		}
 
		var entries = parser.getProcessedData(options.csv);

		var actionChoose = options.find ? 'find' : (options.delete ? 'delete' : 'create');
		console.log('Action choose : ' + actionChoose);

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
				//show email details if it exists
				 if (options.find){ 
					if(mailbox.itemNotFoundFault) {
						console.error(item.Username +' not found');
						callback(null, mailbox);
					}
					else{
						console.log(mailbox);
						callback(null, mailbox);
					}
				}
				//delete email if it exists
				else if(options.delete){
					if(mailbox.itemNotFoundFault) {
						console.error(item.Username +' not found');
						callback(null, mailbox);
					}
					else {
						rackspace.deleteMailBox(item.Username, (result) => {
							callback(null, mailbox);
						});
					}
				} 				
				//create email or overwrite
				else {
					if(mailbox.itemNotFoundFault) {
						// Mailbox does not exist
						rackspace.createMailbox(item, () => {
							callback(null, mailbox)
						});
					} 
					else {
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
	//Show all emails on this domain
	else{
		console.log('The list of mailboxes :');
		rackspace.getAllMailbox(0, (mailboxes, offset) => { 
			if(mailboxes.total > 0) {
				if(offset == 0){
					console.log('There is ' + mailboxes.total + ' mailboxes :');
					var headerLine= 'name;lastLogin;enabled;size;currentUsage;createdDate';
					if(options.markBeforeYear > 0)
						headerLine +=';markBeforeYear ' + options.markBeforeYear;
					console.log(headerLine);

				}
				
				for(var i = 0 ; i < mailboxes.rsMailboxes.length ; i++){ 
					var line = mailboxes.rsMailboxes[i].name + ';' 
						+mailboxes.rsMailboxes[i].lastLogin + ';'
						+mailboxes.rsMailboxes[i].enabled + ';'
						+mailboxes.rsMailboxes[i].size + ';'
						+mailboxes.rsMailboxes[i].currentUsage + ';'
						+mailboxes.rsMailboxes[i].createdDate;

					if(options.markBeforeYear > 0){
						var lastLoginDate;
						if(mailboxes.rsMailboxes[i].lastLogin){
							lastLoginDate = moment(mailboxes.rsMailboxes[i].lastLogin, 'MM/DD/YYYY hh:mm:ss a');
						}

						var createdDate = moment(mailboxes.rsMailboxes[i].createdDate, 'MM/DD/YYYY hh:mm:ss a');
						var shouldDeleteBeforeDate = moment().subtract(options.markBeforeYear, 'year');

						var shouldDelete = 0;
						if((!mailboxes.rsMailboxes[i].lastLogin && createdDate.isBefore(shouldDeleteBeforeDate))
							|| (mailboxes.rsMailboxes[i].lastLogin && lastLoginDate.isBefore(shouldDeleteBeforeDate))){
							shouldDelete = 1;
						}

						line += ';' + shouldDelete;
					}

					console.log(line); 
				}
			}
			else {
				console.log('There is no mailboxes on this domain');
			}
		});
	}
}

program
	.arguments('<accountNumber>', 'Customer account number')
	.arguments('<domain>', 'Domain')
	.option('-c, --csv <filename>', 'Csv source file')
	.option('-u, --userkey <userkey>', 'User Key (required)')
	.option('-s, --secretkey <secretkey>', 'Secret Key (required)')
	.option('-c, --csv <filename>', 'Csv source file') 
	.option('-a, --add', 'Create maiboxes, you must specify --csv <filename>')
	.option('-d, --delete', 'Delete maiboxes, you must specify --csv <filename>')
	.option('-f, --find', 'Show emails details, you must specify --csv <filename>')
	.option('-v, --verbose', 'Verbose mode')
	.option('-F, --force', 'Overwrite existing mailboxes if --add is used') 
	.option('-m, --mark-before-year <years>', 'Work in list mode : add a column to mark mailbox where there is no login since x years', parseInt, 0)
	.action(mainFunction)
	.parse(process.argv);

if (!program.args || program.args.length === 0)
	program.help();
