
// ------------------------------------------------------------------
// APP CONFIGURATION, Used by JOVO for deployment
// ------------------------------------------------------------------

module.exports = {

    // COMMENT OUT WHEN RUNNING TESTS
    // -------------------
    // Need to be commented out while running unit tests so only i18n keys returned. https://www.jovo.tech/docs/unit-testing
    i18n: {
        returnNull: false,
        fallbackLng: 'en-US',
    },
    // -------------------

    logging: true,

    // user: {
    //     context: {
    //         enabled: true,
    //         prev: {
    //             size: 3,
    //             response: {
    //                 speech: true,
    //                 reprompt: true,
    //                 state: true,
    //                 output: false,
    //             },
    //         },
    //     },
    // },

    intentMap: {
        'AMAZON.StopIntent': 'END',
        'AMAZON.YesIntent': 'YesIntent',
        'AMAZON.NoIntent': 'NoIntent'
    },

    // db: {
    //     FileDb: {
    //         pathToFile: '../db/db.json',
    //     }
    // },

    db: {
        Firestore: {
            credential: require('./firebase-private-key'),
            databaseURL: 'https://wyzefind-jovo-integration.firebaseio.com'
        }
    },

    analytics: {
        DashbotGoogleAssistant: {
            key: 'i4ncDHS9kjrtHTkaRkyXLtEf6Y1yZAJO51iuM73r',
        },
        ChatbaseGoogleAssistant: {
            key: '11ccaf9c-e8f4-4314-a59e-ae5ca612c17e'
        }
    },
};
