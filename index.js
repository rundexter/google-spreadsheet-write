var _ = require('lodash')
    , Q = require('q')
    , assert = require('assert')
    , GoogleSpreadsheet = require('edit-google-spreadsheet')
    , util = require('util')
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
            , startRow = step.input('start_row').first()
            , startCol = step.input('start_col', 1).first()
            , col1 = step.input('col1_data').toArray()
            , col2 = step.input('col2_data').toArray()
            , col3 = step.input('col3_data').toArray()
            , col4 = step.input('col4_data').toArray()
            , col5 = step.input('col5_data').toArray()
            , email = dexter.environment('google_app_client_email')
            , privateKey = dexter.environment('google_app_client_private_key')
            , colCount
            , data = []
            , self = this
            , spreadsheet
            , rows
            , meta
            ;
        if(startRow) {
            startRow = parseInt(startRow, 10);
        }
        //console.log(spreadsheetId, worksheetId, col1, col2, col3, col4, col5, startRow, endRow);
        //A few simple assertions
        assert(spreadsheetId, 'Spreadsheet key requried (look for it in the spreadsheet\'s URL');
        assert(!isNaN(worksheetId) && worksheetId >= 0, 'Worksheet ID must be an integer, and will default to 0 if left out');
        assert(startRow === null || (!isNaN(startRow) && startRow >= 1), 'If provided, start row must be an integeter > 1');
        assert(!isNaN(startCol) && startCol >= 1, 'Start column must be an integeter, and will default to 1 if left out');
        //Make sure we have both email and privatekey
        assert(Boolean(email) && Boolean(privateKey), 'Email and private key are required, either as private settings or step inputs');


        _.each([col1, col2, col3, col4, col5], function(col) {
            if(!colCount || col.length > colCount) {
                colCount = col.length;
            }
        });

        //Exit early if there's no data
        if(colCount === 0) {
            return this.complete({});
        }

        //Assemble our data
        data = this.assemble(step, dexter, {
            col1: col1, 
            col2: col2, 
            col3: col3,
            col4: col4,
            col5: col5
        });

        //Set up our API configuration
        options = {
            //debug: true,
            spreadsheetId: spreadsheetId,
            worksheetId: worksheetId,
            oauth: {
                email: email,
                key: privateKey
            }
        };

        //Kick off the promise chain!
        Q.ninvoke(GoogleSpreadsheet, 'load', options)
            .then(function(ss) {
                spreadsheet = ss;
                return Q.ninvoke(spreadsheet, 'receive');
            })
            .then(function(rowResponse) {
                rows = rowResponse[0];
                return Q.ninvoke(spreadsheet, 'metadata');
            })
            .then(function(metaResponse) {
                var endCol = startCol + colCount - 1
                    , endRow
                    , newMeta = {}
                ;
                meta = metaResponse;

                if(!startRow) {
                    startRow = self.getFirstEmptyRow(rows);
                    self.log('No explicit start row given: found first empty row at', startRow);
                }
                endRow = startRow + data.length;
                self.log(util.format('Sheet has %d row(s) and %d column(s).  Writing %d items starting at row %d, column %d, and ending at row %d column %d.'
                    , meta.rowCount 
                    , meta.colCount 
                    , data.length
                    , startRow
                    , startCol
                    , endRow
                    , endCol
                ));
                if(endCol > meta.colCount) {
                    //Just make enough room for this data - we should only ever have to do this once.
                    newMeta.colCount = endCol;
                }
                if(endRow > meta.rowCount) {
                    //Make enough room for at LEAST 3 more batches of data, since we'll probably have to do this a lot.
                    //TODO Make this behavior controllable via private variable...it'd be nice to be able to error out, make a tight fit,
                    //  make a HUGE amount of extra room, etc.
                    newMeta.rowCount = meta.rowCount + (data.length * 3);
                }
                if(Object.keys(newMeta).length > 0) {
                    self.log('Updating worksheet size to accommodate data', newMeta);
                    return Q.ninvoke(spreadsheet, 'metadata', newMeta);
                } else {
                    return Q();
                }
            })
            .then(function(metaOrNull) {
                cmd = {};
                cmd[startRow] = {};
                cmd[startRow][startCol] = data;
                spreadsheet.add(cmd);
                //There's an autosize parameter for this function, but it doesn't seem to work, which is why we're doing it manually.
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
     * @param {StepData} step Step data
     * @param {AppData} dexter App instance data
     * @param {Object} dataCollection Indexed collection of passed data
     * @return {array} Stitched array only containing the data we meant to be here
     */
    assemble: function(step, dexter, dataCollection) {
        var toZip = []
            , endpoint
            , mapFound = false
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
        //Check each endpoint in reverse order.  We'll only zip up columns in front of and including the last mapped item.
        //Ex 1: col1_data=x, col2_data=null, col3_data=y, map 1-3
        //Ex 2: col1_data=null, col2_data=x, col3_data=null, map 1-2
        _.each(['col5_data', 'col4_data', 'col3_data', 'col2_data', 'col1_data'], function(inputKey) {
            var mapData = endpoint.input_map[inputKey]
                , hasData = mapData !== null && mapData !== undefined
            ;
            if(hasData) {
                mapFound = true;
            }
            if(mapFound) {
                if(hasData) {
                    toZip.unshift(dataCollection[inputKey.replace('_data', '')]);
                } else {
                    toZip.unshift([]);
                }
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
    },
    getFirstEmptyRow: function(rows) {
        var firstEmpty = 1;
        _.each(rows, function(row, idx) {
            var empty = true;
            firstEmpty = parseInt(idx, 10) + 1;
            _.each(row, function(col) {
                if(Boolean(col)) {
                    empty = false;
                    return false;
                }
            });
            if(empty) {
                return false;
            }
        });
        return firstEmpty;
    }
};

