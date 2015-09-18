# Google Spreadsheet Writer 

This [Dexter](http://rundexter.com) module allows you to write 1-5 
columns from your App into a Google Apps Spreadsheet.  It uses the 
[Edit Google Spreadsheet](https://github.com/jpillora/node-edit-google-spreadsheet) 
library under the hood.

# Configuring the Step

## Input parameters

Parameter|Required|Multiple?|Details
---------|--------|---------|-------
start_row | No | No | Which row to start reading from (defaults to 2: assumes there's a header in 1)
start_col | No | No | Which column index to start at, (defaults to 1)
email | No | No | Your Service Account's email.  If not set, it will try to use the matching environment variable as a default.
private_key | No | No | Your Service account's entire private key (not the filename!).  If not set, it will try to use the matching environment variable as a default.
col1_data | No | No | Data to write in the 1st column* 
col2_data | No | No | Data to write in the 2nd column*
col3_data | No | No | Data to write in the 3rd column*
col4_data | No | No | Data to write in the 4th column*
col5_data | No | No | Data to write in the 5th column*

\* Only columns that have explicit bindings from the app editor will be
written to the spreadsheet.  Those columns will always overwrite the data
that's there.  Unassigned columns will NOT overwrite what's there.

**Example 1**

column 1 is bound to the string 'Hello', the rest are not bound.

The existing table looks like:

    A      B
    C      D

Writing to row 1 column 1 will result in:

    Hello  B
    C      D

**Example 2**

column 1 is bound to step('a').input('foo'), which returns 'Hello'
column 2 is bound to step('b').input('bar'), which returns nothing.

The existing table looks like:

    A      B
    C      D

Writing to row 1 column 1 will result in:

    Hello  
    C      D

...since column 2 was bound and was empty.

## Managing credentials

### Private Keys

Parameter|Required?|Details
---------|---------|-------
google_spreadsheet | Yes | The ID of the spreadsheet you're writing to
google_app_client_email | Yes | Your Service Account's email
google_app_client_private_key | Yes | Your Service Account's private key (the key itself, NOT the filename!)


### Getting the spreadsheet key

Look in your spreadsheet's URL. Betweed the d/ and /edit is a bunch
of random-looking characters.  This is your spreadsheet's key.

### Creating credentials

To use this module, you must have a Google spreadsheet with oAuth
credentials established.  To accomplish this, follow these steps:

1. Create a spreadsheet
1. Create a new project in the [Developers's Console](https://console.developers.google.com/project)
1. In the sidebar, go to APIs &amp; Auth &gt; APIs
1. Search for "drive", choose "Drive API", and "Enable API"
1. In the sidebac, go to APIs &amp; Auth &gt; Credentials
1. Go to Add Credentials &gt; Service Account
1. Choose JSON and "Create"
1. Move the downloaded JSON file someplace safe - you won't be able to download it again!
  * (you can always create a new service account if you lose your credentials)
1. Go back to your spreadsheet and share the doc with the email in the JSON file

Once you've got your credentials, you can use them in your App in one of two ways

### App-wide credentials

If you want EVERYONE who uses the app to add to the same spreadsheet, 
you can put the credentials in as private keys:

 google_app_client_email: <the email in the json file>
 google_app_client_private_key: <the ENTIRE private key in the JSON file, including line breaks>

Or as fixed entries in the email/private_key settings in the step itself.

### User-specific credentials

If you want each user to be to bring their own spreadsheet, leave the 
spreadsheet, email, and private key fields as user-driven, and share
the credential generating process above with them.

# Forking &amp; Testing
If you'd like to customize this module, fork it in Github, clone your
fork to your computer, then take the following steps:

1. Change the package.json:name to a unique package name (dexter check_name will help you here)
1. COPY env.example.js into a new env.js file and hook it up as instructed
1. Make sure your test spreadsheet has some values that match the queries in fixtures/default.js
1. dexter run to make sure everything's working
1. run dexter init inside your newly cloned repo

