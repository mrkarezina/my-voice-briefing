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

    console.log('url here' , urlSelected);

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


exports.ssmlTitlesBuilder = (articles, explainableRelations = false) => {
    /**
     * Used to build a SSML to present the titles nicley
     *
     */

    let speech = [];
    const possibleTransistions = ["also mentions", "also focuses on", "also talks about"];

    for (let i = 0; i < articles.length; i++) {

        const title = articles[i]['title'].replace(' - Harvard Health Blog', ' ')

        if (explainableRelations) {
            //Add explanation for how article is related

            //Get the label of each concept
            let commonConcepts = articles[i]["concepts"].slice(0, 3);
            commonConcepts = commonConcepts.map(function (e) {
                return e['label']
            });

            //Case to structure the explanation
            let explanation = ``
            switch (commonConcepts.length) {
                case 0:
                    explanation = ``;
                    break;
                case 1:
                    explanation = `${randomChoose(possibleTransistions)} ${commonConcepts[0]}`
                    break;
                case 2:
                    explanation = `${randomChoose(possibleTransistions)} ${commonConcepts[0]} and ${commonConcepts[1]}`
                    break;
                case 3:
                    explanation = `${randomChoose(possibleTransistions)} ${commonConcepts[0]}, ${commonConcepts[1]}, and ${commonConcepts[2]}`
                    break;
            }

            speech.push(
                `
            <break time="0.5s"/>
            The <say-as interpret-as="ordinal">${i + 1}</say-as> story: <break time="0.4s"/>
            ${title} ${explanation}
            `)

        } else {

            //Introduction ie: The __ story, or The last story __
            let intro = `The <say-as interpret-as="ordinal">${i + 1}</say-as> story is`
            if(i === 0) {
                intro = `Today's <say-as interpret-as="ordinal">${i + 1}</say-as> story is`
            } else if (i === articles.length - 1) {
                intro = `And today's last story is`
            }

            speech.push(
                `
            <break time="0.5s"/>
            ${intro}
            ${title}
            `)
        }
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




