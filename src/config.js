
// ------------------------------------------------------------------
// APP CONFIGURATION, Used by JOVO for deployment
// ------------------------------------------------------------------

module.exports = {
    logging: true,

    user: {
        context: {
            enabled: true,
            prev: {
                size: 3,
                response: {
                    speech: true,
                    reprompt: true,
                    state: true,
                    output: false,
                },
            },
        },
    },

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
    cms: {
        GoogleSheetsCMS: {
            spreadsheetId: '1R5k907bpjR1krDXwxHlC8ikpDeN0OS4fXJiuoDz33Ig',
            access: 'public',
            sheets: [
                {
                    name: 'responses',
                    type: 'Responses',
                    position: 1
                }
            ]
        }
    },
};
