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

        //Load articles into cache
        getInitialContent('http://fetchrss.com/rss/5ce8c95d8a93f8d5098b45675ce8ca538a93f8f6148b4567.xml');
        getInitialContent('http://fetchrss.com/rss/5ce8c95d8a93f8d5098b45675ceabe268a93f8f85a8b4567.xml');
        getInitialContent('http://fetchrss.com/rss/5ce8c95d8a93f8d5098b45675ceabe6c8a93f80c5b8b4567.xml');
        getInitialContent('https://us12.campaign-archive.com/feed?u=4d28858ff8aaf5bba521824ba&id=f42d838542');

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
            speech += this.t('welcome').toString().replace('DATE', date)
            written += this.t('welcome.written') + ' ';

            this.$user.$data.isWelcome = false;
        }

        if (this.$user.$data.isHelp) {
            //This acts as the help menu, since HelpIntent is a redirect

            speech += `${this.t('help.menu')} <break time="0.5s"/>`;
            written += this.t('help.menu.written');

            this.$user.$data.isHelp = false
        }

        speech += this.t('initial.topic');

        this.$googleAction.showSuggestionChips(['Google Assistant ', 'Alexa']);
        this.displayText(written.toString()).ask(speech)
    },

    ArticleInfoIntent() {

        // Get article data using stored index
        const selectedArticleIndex = this.$user.$data.selectedArticleIndex;
        const article = this.$user.$data.articles[selectedArticleIndex];

        let speech = ``;

        //A reminder for user to ask for email
        if(this.$user.$data.askToSendEmailReminder) {
            speech += this.t('ask.to.send.reminder') + ' ';
            this.$user.$data.askToSendEmailReminder = false
        }

        speech += `${this.t('summary.intro')} ${article['title']} <break time="0.5s"/>`;

        //Don't repeat title in summary
        speech += article['summary'].replace(article['title'], ' ');
        speech += `<break time="0.7s"/> ${this.t('next.move')}`;

        const basicCard = ArticleInfoCardBuilder(article);
        this.$googleAction.showBasicCard(basicCard);
        this.$googleAction.showSuggestionChips(['Next ⏩', 'Topics ']);


        //Ask which category instead of related
        this.followUpState('SELECT_NEXT_MOVE').displayText(this.t('next.move.written').toString()).ask(speech);
    },

    EmailArticleLinkIntent() {

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

            let speech = this.t('email.sent.confirmation').toString().replace("TITLE", article["title"])
            speech += this.t('next.move');

            this.$googleAction.showSuggestionChips(['Related ⏬', 'Next ⏩']);
            this.followUpState('SELECT_NEXT_MOVE').ask(speech);
        }
    },

    ON_SIGN_IN() {
        if (this.$googleAction.getSignInStatus() === 'CANCELLED') {
            this.tell("Sorry, you'll need to sign in for me to send get your email to send the the link.");
        } else if (this.$googleAction.getSignInStatus() === 'OK') {

            const token = this.$request.originalDetectIntentRequest.payload.user.idToken;
            this.$user.$data.accountData = jwt.decode(token);

            this.toIntent('EmailArticleLinkIntent')

        } else if (this.$googleAction.getSignInStatus() === 'ERROR') {

            //todo: message + try again state
            this.tell('Sorry, there was an error signing in. Please try again.');
        }
    },


    ListOfTopicsIntent() {

        this.$googleAction.showSuggestionChips(['Google Assistant', 'Alexa', 'RAIN Agency']);
        this.displayText('Which topic?').ask(this.t('possible.topics'));

    },

    async GoogleAssistantStoriesIntent() {
        this.$user.$data.articles = await getInitialContent('http://fetchrss.com/rss/5ce8c95d8a93f8d5098b45675ceabe268a93f8f85a8b4567.xml');

        let speech = this.t('Here are the latest Google Assistant stories.');
        speech += ssmlTitlesBuilder(this.$user.$data.articles);
        speech += `<break time="1.2s"/> ${this.t('which.article')}`;

        const articleList = ArticleHeadlineListBuilder(this.$user.$data.articles);

        this.$googleAction.showList(articleList);

        let written = this.t('which.article');

        //So Unhandled() can deal with users who don't use ordinal selection
        this.$user.$data.isOrdinalSelection = true;

        //Need to convert to string or displayText will not work
        this.followUpState('ORDINAL_SELECTION_STATE').displayText(written.toString()).ask(speech)
    },
    async AlexaStoriesIntent() {
        this.$user.$data.articles = await getInitialContent('http://fetchrss.com/rss/5ce8c95d8a93f8d5098b45675ceabe6c8a93f80c5b8b4567.xml');

        let speech = this.t('Here are the latest Alexa stories.');
        speech += ssmlTitlesBuilder(this.$user.$data.articles);
        speech += `<break time="1.2s"/> ${this.t('which.article')}`;

        const articleList = ArticleHeadlineListBuilder(this.$user.$data.articles);

        this.$googleAction.showList(articleList);

        let written = this.t('which.article');

        //So Unhandled() can deal with users who don't use ordinal selection
        this.$user.$data.isOrdinalSelection = true;

        //Need to convert to string or displayText will not work
        this.followUpState('ORDINAL_SELECTION_STATE').displayText(written.toString()).ask(speech)
    },
    async RainAgencyStoriesIntent() {
        this.$user.$data.articles = await getInitialContent('https://us12.campaign-archive.com/feed?u=4d28858ff8aaf5bba521824ba&id=f42d838542');

        let speech = this.t('Here are the latest stories from RAIN Agency.');
        speech += ssmlTitlesBuilder(this.$user.$data.articles);
        speech += `<break time="1.2s"/> ${this.t('which.article')}`;

        const articleList = ArticleHeadlineListBuilder(this.$user.$data.articles);

        this.$googleAction.showList(articleList);

        let written = this.t('which.article');

        //So Unhandled() can deal with users who don't use ordinal selection
        this.$user.$data.isOrdinalSelection = true;

        //Need to convert to string or displayText will not work
        this.followUpState('ORDINAL_SELECTION_STATE').displayText(written.toString()).ask(speech)
    },



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

        //If user did not say ordinal, reprompt
        if (this.$user.$data.isOrdinalSelection) {

            this.$user.$data.isOrdinalSelection = false;
            return this.followUpState('ORDINAL_SELECTION_STATE').ask(this.t('ordinal.selection.reprompt'));
        }

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