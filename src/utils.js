const {List, OptionItem, BasicCard} = require('jovo-platform-googleassistant');
const requestPromise = require('request-promise-native');
const sgMail = require('@sendgrid/mail');

const {NUMBER_OF_ARTICLES, DB_ID, PROCESSOR_ID, WYZEFIND_CORE_API_BASE, SENDGRID_API_KEY} = require('./constants');

exports.getInitialContent = async (urlSelected) => {
    /**
     * Async fetch of article data in rss
     *
     * @type {{uri, json: boolean}}
     */

    const options = {
        method: 'POST',
        uri: WYZEFIND_CORE_API_BASE + '/rss-content',
        json: true, // Automatically parses the JSON string in the response

        //TODO: can;t have variable
        body: {
            rss_url: urlSelected,
        }
    };

    return await requestPromise(options);
};

exports.sendArticleLinkEmail = (article, name, email) => {
    /**
     * Send an email containing more information on an article, using SendGrid
     */

    sgMail.setApiKey(SENDGRID_API_KEY);
    const msg = {
        to: email,
        from: 'noreply@assistant.vecgraph.com',
        templateId: 'd-d633bf79053b42be9b0ae0111de2678b',
        dynamic_template_data: {
            "subject": article["title"],
            "name": name,
            "title": article["title"],
            "introText": article["summary"],
            "action_url": article["url"]
        },
    };

    sgMail.send(msg);
};


exports.getRelatedArticleData = async (urlSelected, apiEndpoint) => {
    /**
     * Async fetch of related article data.
     * API endpoint is attached to base url
     *
     * @type {{uri, json: boolean}}
     */

    const options = {
        method: 'POST',
        uri: WYZEFIND_CORE_API_BASE + apiEndpoint,
        json: true, // Automatically parses the JSON string in the response
        body: {
            article_url: urlSelected,
            user_id: DB_ID,
            processor_id: PROCESSOR_ID
        }
    };

    return await requestPromise(options);
};


exports.ArticleHeadlineListBuilder = (articles) => {
    /**
     * Builds a Google Assitant Visual list to show article headlines
     * @type {List}
     */

    //Make sure not to many articles
    articles = articles.slice(0, NUMBER_OF_ARTICLES);

    const list = new List();
    for (let i = 0; i < articles.length; i++) {
        list.addItem(
            (new OptionItem())
                .setTitle(articles[i]['title'])
                .setImage({
                    url: articles[i]['img_url'],
                    accessibilityText: 'Article Headline Image',

                })
                .setKey(`${i}`)
        );
    }

    return list
};


exports.ArticleInfoCardBuilder = (article) => {
    /**
     * Takes a single article object and returns a Google Assistant Card object
     */

    let basicCard = new BasicCard()
        .setTitle(article['title'])
        .setFormattedText(article['summary'].substring(0, 80) + '...')
        .setImage({
            url: article['img_url'],
            accessibilityText: 'Article Headline Image',
        })
        .setImageDisplay('WHITE')
        .addButton('Read Full', article['url']);

    return basicCard

};


exports.ssmlTitlesBuilder = (articles) => {
    /**
     * Used to build a SSML to present the titles nicley
     *
     */

    let speech = [];

    const beginningTransitions = [`Today's <say-as interpret-as="ordinal">1</say-as> story is`, `First up, we've got`];
    const endTransitions = ["And today's last story is", "And the last story is", "And finally, the last story is"];

    for (let i = 0; i < articles.length; i++) {

        //Introduction ie: The __ story, or The last story __
        let intro = `The <say-as interpret-as="ordinal">${i + 1}</say-as> story is`
        if (i === 0) {
            intro = randomChoose(beginningTransitions)
        } else if (i === articles.length - 1) {
            intro = randomChoose(endTransitions)
        }

        speech.push(
            ` ${intro}
            <prosody rate="medium">
                ${articles[i]["title"]} .
                ${articles[i]["summary"].split(".")[1]}
            </prosody>
            
            <break time="0.8s"/>`)
    }

    return speech.join(" ")
};

exports.urlFromTitle = (articles, title) => {
    /**
     * Get URL from title
     */

    return articles.filter((article) => {
        if (article.title === title) {
            return article
        }
    })[0]['url']
};


randomChoose = (choices) => {
    /**
     * Simple random selector
     * @type {number}
     */
    let index = Math.floor(Math.random() * choices.length);
    return choices[index];
};




