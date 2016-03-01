var _   = require('lodash')
  , env = require('./env')
;

module.exports = _.merge({
    /*
     * Some default settings. 
     *
     * You can generally leave this as is for general testing purposes.
     */
    simulation: true
    , instance_id: 'local_test_instance'
    , urls: {
        home: "http://rundexter.com/"
    }
    , instance_state: {
        active_step :  "local_test_step"
    }
    , workflow: {
        "id" : "local_test_workflow"
        , "title": "Local test workflow"
        , "description": "A fixture workflow used to test a module"
    }
    , steps: {
        dummy_prev: {
            id: 'dummy_prev',
            next: [{
                id: 'local_test_step',
                input_map: {
                    //Some data here is necessary to fool the data assembler...real values, however, aren't (see implementation for details)
                    //These values will NOT work in a real app
                    col1_data: 'dexter.step(...).input(foo)',
                    col2_data: null,
                    col3_data: 'dexter.step(...).input(bar)',
                    col4_data: null
                }
            }]
        },
        local_test_step: {
            id: 'local_test_step'
            , prev: 'dummy_prev'
            , type: 'module'
            //The test runner will change YOUR_MODULE_NAME to the correct module name
            , name: 'YOUR_MODULE_NAME'
            , next: []
        }
    }
    , modules: {
        //The test runner will add the proper data here
    }
    /*
     * End defaults
     */
    , environment: {
    }
    , user: {
    }
    , data: {
        local_test_step: {
            input: {
                col1_data      : [ 'foobar', 'hello', 'george' ],
                col3_data      : [ 'bar', 'world' ],
                start_col      : 1,
                email          : 'daniel@rundexter.com',
                spreadsheet_id : "1XedAjqHYzObCWfa-UWhd8yDD6wf-p1Rbe862uAWGyiw"
            }
        }
    }
}, env);
