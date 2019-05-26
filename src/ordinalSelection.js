/**
 * Import as ORDINAL_SELECTION_STATE
 */

module.exports = {
    FirstIntent() {
        this.$user.$data.selectedArticleIndex = 0;

        this.$user.$data.isOrdinalSelection = false;
        return this.toIntent('ArticleInfoIntent');
    },
    SecondIntent() {
        this.$user.$data.selectedArticleIndex = 1;

        this.$user.$data.isOrdinalSelection = false;
        return this.toIntent('ArticleInfoIntent');
    },
    ThirdIntent() {
        this.$user.$data.selectedArticleIndex = 2;

        this.$user.$data.isOrdinalSelection = false;
        return this.toIntent('ArticleInfoIntent');
    },
    FourthIntent() {
        this.$user.$data.selectedArticleIndex = 3;

        this.$user.$data.isOrdinalSelection = false;
        return this.toIntent('ArticleInfoIntent');
    },
    FifthIntent() {
        this.$user.$data.selectedArticleIndex = 4;

        this.$user.$data.isOrdinalSelection = false;
        return this.toIntent('ArticleInfoIntent');
    },
    SixthIntent() {
        this.$user.$data.selectedArticleIndex = 5;

        this.$user.$data.isOrdinalSelection = false;
        return this.toIntent('ArticleInfoIntent');
    }
};