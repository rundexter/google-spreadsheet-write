var _ = require('lodash')
    , Q = require('q')
    , assert = require('assert')
    , GoogleSpreadsheet = require('edit-google-spreadsheet')
    ;

module.exports = {
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var spreadsheetId = dexter.environment('google_spreadsheet')
            , worksheetId = 1 //parseInt(step.input('worksheet').first() || 1, 10)
            , startRow = step.input('start_row', 2).first()
            , startCol = step.input('start_col', 1).first()
            , col1 = step.input('col1_data').toArray()
            , col2 = step.input('col2_data').toArray()
            , col3 = step.input('col3_data').toArray()
            , col4 = step.input('col4_data').toArray()
            , col5 = step.input('col5_data').toArray()
            , email = dexter.environment('google_app_client_email')
            , privateKey = dexter.environment('google_app_client_private_key')
            , data = []
            , self = this
            , spreadsheet
            ;
        if(startRow) startRow = parseInt(startRow, 10);
        //console.log(spreadsheetId, worksheetId, col1, col2, col3, col4, col5, startRow, endRow);
        //A few simple assertions
        assert(spreadsheetId, 'Spreadsheet key requried (look for it in the spreadsheet\'s URL');
        assert(!isNaN(worksheetId) && worksheetId >= 0, 'Worksheet ID must be an integer, and will default to 0 if left out');
        assert(startRow === null || (!isNaN(startRow) && startRow >= 1), 'If provided, start row must be an integeter > 1');
        assert(!isNaN(startCol) && startCol >= 1, 'Start column must be an integeter, and will default to 1 if left out');
        //Make sure we have both email and privatekey
        assert(Boolean(email) && Boolean(privateKey), 'Email and private key are required, either as private settings or step inputs');

        //Assemble our data
        data = this.assemble(step, dexter, {
            col1: col1, 
            col2: col2, 
            col3: col3,
            col4: col4,
            col5: col5
        });

        options = {
            //debug: true,
            spreadsheetId: spreadsheetId,
            worksheetId: worksheetId,
            oauth: {
                email: email,
                key: privateKey
            }
        };
        Q.ninvoke(GoogleSpreadsheet, 'load', options)
            .then(function(ss) {
                spreadsheet = ss;
                return Q.ninvoke(spreadsheet, 'metadata');
            })
            .then(function(metadata) {
                var targetRow = startRow || metadata.rowCount
                    , cmd = {};
                self.log('Writing ' + data.length + ' items starting at row ' + targetRow + ' column ' + startCol);
                cmd[targetRow] = {};
                cmd[targetRow][startCol] = data;
                spreadsheet.add(cmd);
                return Q.ninvoke(spreadsheet, 'send');
            })
            .then(function(x) {
                self.complete({});
            })
            .fail(function(err) {
                if(err.stack) {
                    console.log(err.stack);
                }
                self.fail(err);
            })
            ;
    },
    /**
     * Tease the required data out of the given values by determining what data the
     *   user actually wanted
     *
     * @param {AppData} dexter App instance data
     * @param {Object} dataCollection Indexed collection of passed data
     * @return {array} Stitched array only containing the data we meant to be here
     */
    assemble: function(step, dexter, dataCollection) {
        var toZip = []
            , endpoint
            , zipped;
        //Get the endpoint that we came from
        _.each(step.prev().config('next'), function(cfg) {
            if(cfg.id === step.config('id')) {
                endpoint = cfg;
                return false;
            }
        });
        if(!endpoint) {
            throw new Error('Unable to determine previous step');
        }
        _.each(endpoint.input_map, function(val, key) {
            if(val !== null && val !== undefined) {
                toZip.push(dataCollection[key.replace('_data', '')]);
            }
        });
        zipped = _.zip.apply(_, toZip);
        _.each(zipped, function(rowvals, rowidx) {
              _.each(rowvals, function(colval, colidx) {
                  if(colval === undefined) {
                      zipped[rowidx][colidx] = '';
                  }
              });
        });
        return zipped;
    }
};

