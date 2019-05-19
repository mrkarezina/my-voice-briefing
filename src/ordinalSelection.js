/**
 * Import as ORDINAL_SELECTION_STATE
 */

module.exports = {
    FirstIntent() {
        this.$user.$data.selectedArticleIndex = 0;
        return this.toIntent('ArticleInfoIntent');
    },
    SecondIntent() {
        this.$user.$data.selectedArticleIndex = 1;
        return this.toIntent('ArticleInfoIntent');
    },
    ThirdIntent() {
        this.$user.$data.selectedArticleIndex = 2;
        return this.toIntent('ArticleInfoIntent');
    },
    FourthIntent() {
        this.$user.$data.selectedArticleIndex = 3;
        return this.toIntent('ArticleInfoIntent');
    },
    FifthIntent() {
        this.$user.$data.selectedArticleIndex = 4;
        return this.toIntent('ArticleInfoIntent');
    },
    SixthIntent() {
        this.$user.$data.selectedArticleIndex = 5;
        return this.toIntent('ArticleInfoIntent');
    },

    // // TODO: always activated
    // Unhandled() {
    //     /**
    //      * Fallback intent. If the user did not use ordinal selection, repromt and try again.
    //      */
    //
    //     this.followUpState('ORDINAL_SELECTION_STATE').ask(this.t('ordinal.selection.reprompt'));
    //
    // },
};