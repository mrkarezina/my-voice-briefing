'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const {App} = require('jovo-framework');
const {Alexa} = require('jovo-platform-alexa');
const {GoogleAssistant} = require('jovo-platform-googleassistant');
const {JovoDebugger} = require('jovo-plugin-debugger');
const {Firestore} = require('jovo-db-firestore');
const {GoogleSheetsCMS} = require('jovo-cms-googlesheets');
const {DashbotGoogleAssistant} = require('jovo-analytics-dashbot');

const jwt = require('jsonwebtoken');

const ORDINAL_SELECTION_STATE = require('./ordinalSelection');
const NEWS_SOURCES_INTENTS = require('./newsSources');

const {ArticleInfoCardBuilder, sendArticleLinkEmail} = require('./utils');

const app = new App();

app.use(
    new Alexa(),
    new GoogleAssistant(),
    new JovoDebugger(),
    new Firestore(),
    new GoogleSheetsCMS(),
    new DashbotGoogleAssistant()
);

// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------


app.setHandler({
    // Order of the intents in app.js seems to matter. Ordinal selection was not working until it was moved back to original position.

    LAUNCH() {

        this.$user.$data.isWelcome = true;
        this.$user.$data.isHelp = false;
        this.$user.$data.isOrdinalSelection = false;
        this.$user.$data.askToSendEmailReminder = true;

        return this.toIntent('InitialContentIntent');
    },

    async InitialContentIntent() {
        /**
         * Used to give a list of headline choices to user
         * @type {string}
         */

        let speech = '';
        let written = '';

        if (this.$user.$data.isWelcome) {
            //Add welcome message if just launched

            const date = new Date().toLocaleDateString();

            // Using i18n keys with parameters
            speech += this.t('welcome', {date: date});
            written += this.t('welcome_written') + ' ';

            this.$user.$data.isWelcome = false;
        }

        if (this.$user.$data.isHelp) {
            //This acts as the help_menu, since HelpIntent is a redirect

            speech += `${this.t('help_menu')} <break time="0.5s"/>`;
            written += this.t('help_menu_written');

            this.$user.$data.isHelp = false
        }

        speech += this.t('initial_topic');

        this.$googleAction.showSuggestionChips(['Google Assistant', 'Alexa', 'Siri', 'Cortana', 'Bixby']);
        this.displayText(written.toString()).ask(speech)
    },

    ArticleInfoIntent() {

        // Get article data using stored index
        const selectedArticleIndex = this.$user.$data.selectedArticleIndex;
        const article = this.$user.$data.articles[selectedArticleIndex];

        let speech = ``;

        //A reminder for user to ask for email
        if (this.$user.$data.askToSendEmailReminder) {
            speech += this.t('ask_to_send_reminder') + ' ';
            this.$user.$data.askToSendEmailReminder = false
        }

        speech += `${this.t('summary_intro')} ${article['title']} <break time="0.5s"/>`;

        //Don't repeat title in summary
        speech += article['summary'].replace(article['title'], ' ');
        speech += `<break time="0.7s"/> ${this.t('next_moves')}`;

        const basicCard = ArticleInfoCardBuilder(article);
        this.$googleAction.showBasicCard(basicCard);
        this.$googleAction.showSuggestionChips(['Next ⏩', 'Topics', 'Email Link']);

        this.followUpState('SELECT_NEXT_MOVE').displayText(this.t('next_moves_written').toString()).ask(speech);
    },

    EmailArticleLinkIntent() {

        const userData = this.$user.$data.accountData;

        if (!userData) {
            //If no user data, go through account linking flow
            this.ask(this.t('account_linking_explanation'));
            return this.showAccountLinkingCard();

        } else {

            // Get article data using stored index
            const selectedArticleIndex = this.$user.$data.selectedArticleIndex;
            const article = this.$user.$data.articles[selectedArticleIndex];

            const {given_name, email} = this.$user.$data.accountData;

            sendArticleLinkEmail(article, given_name, email);

            let speech = this.t('email.sent.confirmation') + ' ';
            speech += this.t('next_moves');

            this.$googleAction.showSuggestionChips(['Next ⏩', 'Topics']);
            this.followUpState('SELECT_NEXT_MOVE').ask(speech);
        }
    },

    ON_SIGN_IN() {
        if (this.$googleAction.getSignInStatus() === 'CANCELLED') {

            let speech = this.t('acountlink_canceled') + ' ';
            speech += this.t('next_moves');

            this.$googleAction.showSuggestionChips(['Next ⏩', 'Topics']);
            this.followUpState('SELECT_NEXT_MOVE').ask(speech);

        } else if (this.$googleAction.getSignInStatus() === 'OK') {

            const token = this.$request.originalDetectIntentRequest.payload.user.idToken;
            this.$user.$data.accountData = jwt.decode(token);

            this.toIntent('EmailArticleLinkIntent')

        } else if (this.$googleAction.getSignInStatus() === 'ERROR') {

            let speech = this.t('acountlink_error') + ' ';
            speech += this.t('next_moves');

            this.$googleAction.showSuggestionChips(['Next ⏩', 'Topics']);
            this.followUpState('SELECT_NEXT_MOVE').ask(speech);
        }
    },


    ListOfTopicsIntent() {

        this.$googleAction.showSuggestionChips(['Google Assistant', 'Alexa', 'Siri', 'Cortana', 'Bixby']);
        this.displayText('Which topic?').ask(this.t('possible_topics'));

    },

    ...NEWS_SOURCES_INTENTS,

    SELECT_NEXT_MOVE: {

        NextStory() {
            /**
             * Adjusts selected index and redirects to article info
             */

            //Go back to first article
            if (this.$user.$data.articles.length - 1 === this.$user.$data.selectedArticleIndex) {
                this.$user.$data.selectedArticleIndex = 0
            } else {
                this.$user.$data.selectedArticleIndex += 1
            }

            return this.toIntent('ArticleInfoIntent');

        }

    },

    ON_ELEMENT_SELECTED() {
        /**
         * Called after user selects an element in a card, gets the selected item id (article INDEX)
         *
         */
        this.$user.$data.isOrdinalSelection = false;
        this.$user.$data.selectedArticleIndex = parseInt(this.getSelectedElementId());

        return this.toIntent('ArticleInfoIntent');
    },

    ORDINAL_SELECTION_STATE,

    HelpIntent() {

        this.$user.$data.isHelp = true;
        this.toIntent('InitialContentIntent')
    },

    TRY_AGAIN: {
        /**
         * Yes no in context of: error understanding?
         * @returns {Promise<*>|Promise<void>}
         * @constructor
         */

        YesIntent() {
            /**
             * Redirect in context: See topics
             */

            return this.toIntent('ListOfTopicsIntent');
        },

        NoIntent() {
            /**
             * Redirect in context: See topics
             */

            return this.toIntent('HelpIntent');
        },
    },

    AboutIntent() {
        /**
         * About menu to help user learn more
         */

        this.$googleAction.showLinkOutSuggestion('Vecgraph', 'https://www.vecgraph.com/');
        this.ask(this.t('about'))
    },

    Unhandled() {
        /**
         * Fallback intent. Redirect user to last intent.
         */

        //If user did not say ordinal, reprompt
        if (this.$user.$data.isOrdinalSelection) {

            this.$user.$data.isOrdinalSelection = false;
            return this.followUpState('ORDINAL_SELECTION_STATE').ask(this.t('ordinal_selection_reprompt'));
        }

        //Generate Sorry message
        this.$speech.addText(["I had trouble understanding.", "I’m sorry. I’m having some trouble understanding what you said.", "I didn’t quite get that."]).addText(this.t('unhandled_question'));
        this.followUpState('TRY_AGAIN').ask(this.$speech);

    },

    END() {
        this.tell(this.t('end'));
    }
});


//Temporary workaround to overwrite the "userId": "v/AK0c4GPUGl9li2HES4iSwV4tdv6z+9490BQXivC5U=" provided with the Google Crawler that doesn't work with firestore
app.hook('request', (error, host, jovo) => {

    try {
        const familyName = host.$request.originalDetectIntentRequest.payload.user.profile.familyName;
        if (familyName === 'Crawler') {
            host.$request.originalDetectIntentRequest.payload.user.userId = 'Health_Check_User';
        }
    }
    catch (error) {

    }

});


// For local testing
module.exports.app = app;