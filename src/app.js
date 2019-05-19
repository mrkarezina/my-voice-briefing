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

const jwt = require('jsonwebtoken');

const ORDINAL_SELECTION_STATE = require('./ordinalSelection');
const {getInitialContent, ArticleHeadlineListBuilder, ArticleInfoCardBuilder, ssmlTitlesBuilder, sendArticleLinkEmail} = require('./utils');

const app = new App();

app.use(
    new Alexa(),
    new GoogleAssistant(),
    new JovoDebugger(),
    new Firestore(),
    new GoogleSheetsCMS()
);

// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------


app.setHandler({
    LAUNCH() {

        this.$user.$data.articles = getInitialContent();
        this.$user.$data.selectedArticleIndex = 0;
        this.$user.$data.isWelcome = true;

        return this.toIntent('InitialContentIntent');
    },


    InitialContentIntent() {
        /**
         * Used to give a list of headline choices to user
         * @type {string}
         */

        //Reset articles to headlines
        this.$user.$data.articles = getInitialContent();

        let speech = '';
        let written = '';

        if (this.$user.$data.isWelcome) {
            //Add welcome message if just launched

            speech += this.t('welcome');
            written += this.t('welcome.written') + ' ';

            this.$user.$data.isWelcome = false;
        }

        if (this.$user.$data.isHelp) {
            //This acts as the help menu, since HelpIntent is a redirect

            speech += `${this.t('help.menu')} <break time="0.5s"/>`;
            written += this.t('help.menu.written') + ' ';

            this.$user.$data.isHelp = false
        }

        speech += this.t('initial.articles');
        speech += ssmlTitlesBuilder(this.$user.$data.articles);
        speech += `<break time="0.5s"/> ${this.t('which.article')}`;

        const articleList = ArticleHeadlineListBuilder(this.$user.$data.articles);

        this.$googleAction.showList(articleList);

        written += this.t('which.article');

        //Need to convert to string or displayText will not work
        this.followUpState('ORDINAL_SELECTION_STATE').displayText(written.toString()).ask(speech)
    },

    ON_ELEMENT_SELECTED() {
        /**
         * Called after user selects an element in a card, gets the selected item id (article INDEX)
         *
         */

        this.$user.$data.selectedArticleIndex = parseInt(this.getSelectedElementId());

        return this.toIntent('ArticleInfoIntent');
    },

    ORDINAL_SELECTION_STATE,

    ArticleInfoIntent() {

        // Get article data using stored index
        const selectedArticleIndex = this.$user.$data.selectedArticleIndex;
        const article = this.$user.$data.articles[selectedArticleIndex];

        let speech = `${this.t('snippet.intro')} ${article['title']} <break time="0.5s"/>`;
        speech += article['summary'];
        speech += `<break time="0.7s"/> ${this.t('email.link')}`;

        const basicCard = ArticleInfoCardBuilder(article);
        this.$googleAction.showBasicCard(basicCard);
        this.$googleAction.showSuggestionChips(['Yes ✉️', 'No']);

        //TODO: need to sign in for email message
        this.followUpState('EMAIL_STORY_LINK_CHOICE').displayText(this.t('email.link.written').toString()).ask(speech);
    },

    EMAIL_STORY_LINK_CHOICE: {
        /**
         * Yes no in context of: would you like to get an email with full article?
         * @returns {Promise<*>|Promise<void>}
         * @constructor
         */

        YesIntent() {
            return this.toIntent('EmailStoryIntent');
        },

        NoIntent() {
            this.followUpState('SELECT_NEXT_MOVE').ask(this.t('related.or.next'))
            this.$googleAction.showSuggestionChips(['Related ⏬', 'Next ⏩']);
        },
    },

    EmailStoryIntent() {

        const userData = this.$user.$data.accountData;

        if (!userData) {
            //If no user data, go through account linking flow
            return this.showAccountLinkingCard();

        } else {

            // Get article data using stored index
            const selectedArticleIndex = this.$user.$data.selectedArticleIndex;
            const article = this.$user.$data.articles[selectedArticleIndex];

            const {given_name, email} = this.$user.$data.accountData;

            sendArticleLinkEmail(article, given_name, email);

            let speech = this.t('email.sent.confirmation');
            speech += this.t('related.or.next');

            this.followUpState('SELECT_NEXT_MOVE').ask(speech);
            this.$googleAction.showSuggestionChips(['Related ⏬', 'Next ⏩']);

        }

    },

    ON_SIGN_IN() {
        if (this.$googleAction.getSignInStatus() === 'CANCELLED') {
            this.tell("Sorry, you'll need to sign in to use the app.");
        } else if (this.$googleAction.getSignInStatus() === 'OK') {

            const token = this.$request.originalDetectIntentRequest.payload.user.idToken;
            this.$user.$data.accountData = jwt.decode(token);

            this.toIntent('EmailStoryIntent')

        } else if (this.$googleAction.getSignInStatus() === 'ERROR') {

            //todo: message + try again state
            this.tell('There was an error signing in. Please try again.');
        }
    },

    SELECT_NEXT_MOVE: {

        async ExplainableRelatedArticlesIntent() {
            /**
             * Allows user to browse and select from list of related articles. However relations are explainable
             * @type {any}
             */

            //TODO: temporary next article, with coming soon message
            this.$user.$data.isRelated = true;

            //Go back to first article
            if (this.$user.$data.articles.length - 1 === this.$user.$data.selectedArticleIndex) {
                this.$user.$data.selectedArticleIndex = 0
            } else {
                this.$user.$data.selectedArticleIndex += 1
            }

            return this.toIntent('ArticleInfoIntent');


        },

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
             * Redirect in context: Would you like to see related?
             */

            return this.toIntent(this.$user.$context.prev[1].request.intent);
        },

        NoIntent() {
            /**
             * Redirect in context: Would you like to see related?
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

        //Generate Sorry message
        this.$speech.addText(["I had trouble understanding.", "I’m sorry. I’m having some trouble understanding what you said.", "I didn’t quite get that."]).addText(this.t('unhandled.question'));
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