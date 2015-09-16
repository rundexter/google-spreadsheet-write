var _ = require('lodash')
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
                    col1_data: 'Fake, but something\'s here',
                    col2_data: null,
                    col3_data: 'Also fake',
                    col4_data: ''
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
                col1_data: [ 'foo', 'hello', 'george' ],
                col3_data: [ 'bar', 'world' ]
            }
        }
    }
}, env);
