const {getInitialContent, ArticleHeadlineListBuilder, ssmlTitlesBuilder} = require('./utils');
const {NUMBER_OF_ARTICLES} = require('./constants');

/**
 * Import as NEWS_SOURCES_INTENTS
 */


module.exports = {
    async GoogleAssistantStoriesIntent() {
        const articles = await getInitialContent('http://fetchrss.com/rss/5ce8c95d8a93f8d5098b45675ceabe268a93f8f85a8b4567.xml');
        this.$user.$data.articles = articles.slice(0, NUMBER_OF_ARTICLES);

        let speech = this.t('Here are the latest Google Assistant stories.');
        speech += ssmlTitlesBuilder(this.$user.$data.articles);
        speech += `<break time="1.2s"/> ${this.t('which_article')}`;

        const articleList = ArticleHeadlineListBuilder(this.$user.$data.articles);

        this.$googleAction.showList(articleList);

        let written = this.t('which_article');

        //So Unhandled() can deal with users who don't use ordinal selection
        this.$user.$data.isOrdinalSelection = true;

        //Need to convert to string or displayText will not work
        this.followUpState('ORDINAL_SELECTION_STATE').displayText(written.toString()).ask(speech)
    },
    async AlexaStoriesIntent() {
        const articles = await getInitialContent('http://fetchrss.com/rss/5ce8c95d8a93f8d5098b45675ceabe6c8a93f80c5b8b4567.xml');
        this.$user.$data.articles = articles.slice(0, NUMBER_OF_ARTICLES);

        let speech = this.t('Here are the latest Alexa stories.');
        speech += ssmlTitlesBuilder(this.$user.$data.articles);
        speech += `<break time="1.2s"/> ${this.t('which_article')}`;

        const articleList = ArticleHeadlineListBuilder(this.$user.$data.articles);

        this.$googleAction.showList(articleList);

        let written = this.t('which_article');

        //So Unhandled() can deal with users who don't use ordinal selection
        this.$user.$data.isOrdinalSelection = true;

        //Need to convert to string or displayText will not work
        this.followUpState('ORDINAL_SELECTION_STATE').displayText(written.toString()).ask(speech)
    },
    async SiriStoriesIntent() {
        const articles = await getInitialContent('http://fetchrss.com/rss/5ce8c95d8a93f8d5098b45675cfbc03d8a93f8e25d8b4567.xml');
        this.$user.$data.articles = articles.slice(0, NUMBER_OF_ARTICLES);

        let speech = this.t('Here are the latest Siri stories.');
        speech += ssmlTitlesBuilder(this.$user.$data.articles);
        speech += `<break time="1.2s"/> ${this.t('which_article')}`;

        const articleList = ArticleHeadlineListBuilder(this.$user.$data.articles);

        this.$googleAction.showList(articleList);

        let written = this.t('which_article');

        //So Unhandled() can deal with users who don't use ordinal selection
        this.$user.$data.isOrdinalSelection = true;

        //Need to convert to string or displayText will not work
        this.followUpState('ORDINAL_SELECTION_STATE').displayText(written.toString()).ask(speech)
    },
    async BixbyStoriesIntent() {
        const articles = await getInitialContent('http://fetchrss.com/rss/5ce8c95d8a93f8d5098b45675cfbc0f38a93f866668b4567.xml');
        this.$user.$data.articles = articles.slice(0, NUMBER_OF_ARTICLES);

        let speech = this.t('Here are the latest Bixby stories.');
        speech += ssmlTitlesBuilder(this.$user.$data.articles);
        speech += `<break time="1.2s"/> ${this.t('which_article')}`;

        const articleList = ArticleHeadlineListBuilder(this.$user.$data.articles);

        this.$googleAction.showList(articleList);

        let written = this.t('which_article');

        //So Unhandled() can deal with users who don't use ordinal selection
        this.$user.$data.isOrdinalSelection = true;

        //Need to convert to string or displayText will not work
        this.followUpState('ORDINAL_SELECTION_STATE').displayText(written.toString()).ask(speech)
    },
    async CortanaStoriesIntent() {
        const articles = await getInitialContent('http://fetchrss.com/rss/5ce8c95d8a93f8d5098b45675cfbc0b98a93f898628b4567.xml');
        this.$user.$data.articles = articles.slice(0, NUMBER_OF_ARTICLES);

        let speech = this.t('Here are the latest Cortana stories.');
        speech += ssmlTitlesBuilder(this.$user.$data.articles);
        speech += `<break time="1.2s"/> ${this.t('which_article')}`;

        const articleList = ArticleHeadlineListBuilder(this.$user.$data.articles);

        this.$googleAction.showList(articleList);

        let written = this.t('which_article');

        //So Unhandled() can deal with users who don't use ordinal selection
        this.$user.$data.isOrdinalSelection = true;

        //Need to convert to string or displayText will not work
        this.followUpState('ORDINAL_SELECTION_STATE').displayText(written.toString()).ask(speech)
    },
};