// ------------------------------------------------------------------
// JOVO PROJECT CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
    alexaSkill: {
       nlu: 'alexa',
    },
    googleAction: {
        nlu: 'dialogflow',
        dialogflow: {
            projectId: 'my-voice-briefing',
            keyFile: 'my-voice-briefing-69374866809a.json'
        }
    },
    endpoint: '${JOVO_WEBHOOK_URL}',
};