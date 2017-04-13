# csv2rackspace 
NodeJS tool to create-show-delete multiple rackspace mailboxes from a flat csv file.
You must specify --userkey and --secretkey options to use this.
You also need to specify --csv option for creating, deleting or showing details of rackspace email accounts.
By default, it will list all rackspace email account.

# Installation

npm install -g csv2rackspace

# Usage

Get full usage help

> csv2rackspace --help

Example syntax (list all)

> csv2rackspace -u "userkey" -s "secrekey" accountNumber domain.com


## Options

    -h, --help                   output usage information
    -V, --version                output the version number
    -c, --csv <filename>         Csv source file
    -u, --userkey <userkey>      User Key (required)
    -s, --secretkey <secretkey>  Secret Key (required)
    -c, --csv <filename>         Csv source file
    -a, --add                    Create maiboxes, you must specify --csv <filename>
    -d, --delete                 Delete maiboxes, you must specify --csv <filename>
    -f, --find                   Show emails details, you must specify --csv <filename>
    -v, --verbose                Verbose mode
    -F, --force                  Overwrite existing mailboxes if --add is used

## Csv file format
The csv file must be specified with the following columns seperated by commas. You must keep the following header line in your file : 

    Username,Password,Enabled,FirstName,MiddleInitial,LastName,AlternateEmail,Organization,Department,Title,MobilePhoneNumber,BusinessPhoneNumber,Street,City,State,PostalCode,Country,Notes,UserID,CustomID