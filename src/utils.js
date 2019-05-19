const {List, OptionItem, BasicCard} = require('jovo-platform-googleassistant');
const requestPromise = require('request-promise-native');
const sgMail = require('@sendgrid/mail');

const {NUMBER_OF_ARTICLES, DB_ID, PROCESSOR_ID, WYZEFIND_CORE_API_BASE, SENDGRID_API_KEY} = require('./constants');

exports.getInitialContent = () => {

    return [
        {
            'title': 'Your genes and addiction',
            'url': 'https://www.health.harvard.edu/blog/your-genes-and-addiction-2019012815730',
            'summary': 'Over the last decade, the prevalence of opioid addiction has increased to epidemic levels, but unfortunately therapeutic interventions for the treatment of addiction remain limited. We need to better understand the triggers for the development of addiction in order to develop more targeted prevention and treatments. The function of this system is affected by genetic and environmental factors. How does stress induce epigenetic changes? Accumulating evidence suggests that environmental factors, such as stress, induce epigenetic changes that can trigger the development of psychiatric disorders and drug addiction. Those stress hormones trigger alterations in many systems throughout the body, induce epigenetic changes, and regulate the expression of other genes in the brain. One of the systems that is affected by stress hormones is the brains reward circuitry. The interaction between stress hormones and the reward system can trigger the development of addiction, as well as a stress-induced relapse in drug or alcohol recovery.',
            'img_url': 'https://hhp-blog.s3.amazonaws.com/2019/01/iStock-942646694-640x427.jpg'

        },
        {
            'title': 'In defense of French fries',
            'url': 'https://www.health.harvard.edu/blog/in-defense-of-french-fries-2019020615893',
            "summary": "I thought it must be a slow news day. The New York Times ran a story about French fries with a conclusion that shocked no one: French fries arent a particularly healthy food choice. Could French fries actually kill you? Of course, I immediately wondered: is it really the French fries? What else do big-time consumers of French fries do that might affect their longevity? Are they couch potatoes (or should I say couch fries)? Eating French fries more than twice a week was associated with a more than doubled risk of death. So, as suspected, this study does not prove that the higher rates of death among higher consumers of French fries were actually due to the fries. But are French Fries really a death food? Homemade baked fries using minimal olive or canola oil arent French fries, but theyre close and much healthier. made it sound as though having fries with your meal is a death sentence. But lets not overstate the danger of French fries.",
            'img_url': 'https://hhp-blog.s3.amazonaws.com/2019/01/iStock-647133812-640x427.jpg'
        },
        {
            'title': 'Planet-friendly, plant-based home cooking',
            'url': 'https://www.health.harvard.edu/blog/planet-friendly-plant-based-home-cooking-2019021215990',
            "summary": "With all the news about the health and environmental advantages of eating less meat, many people are trying to eat more plant-based meals. But where do you begin? For example, buy some canned beans. Or if you have a favorite recipe for beef stew, try swapping in beans for some of the meat, he says. And people who eat more home-cooked meals tend to weigh less and have healthier cholesterol and blood sugar values compared with people who eat out frequently. Cooking dried beans is simple. Just soak several cups of beans in cold water overnight. Do this once or twice a week to have a convenient source of plant-based protein around which you can build a meal. If you come home at 6 p.m., tired from a busy day, its good to have a ready-to-use source of protein such as beans available, says Dr. Polak. As with legumes, whole grains are easy to cook, especially bulgur, another of Dr. Polaks favorites.",
            'img_url': 'https://hhp-blog.s3.amazonaws.com/2019/02/iStock-934286312-640x427.jpg'
        },
        {
            'title': 'The rise of push-ups: A classic exercise that can help you get stronger',
            "url": "https://www.health.harvard.edu/blog/rise-push-ups-classic-exercise-can-motivate-get-stronger-2019021810165",
            "summary": "The morning of my 50th birthday in May I did something I had not tried in a long time. I dropped to the floor and did 50 push-ups, one for each year. You can do them anywhere and at any time. All you need is your body weight and a few minutes. Push-ups also can be modified as needed. If this is too difficult, perform from a hands and knees position. You can still engage the core and work your arms and chest, while you place less weight on the wrists and shoulders, says Dr. Phillips. Modifications like knee and inclined push-ups use about 36% to 45% of your body weight. Push-up challenges are trendy. Dr. Phillips. My challenge is to do 50 push-ups every day for the entire year.",
            'img_url': 'https://hhp-blog.s3.amazonaws.com/2016/08/pushup-blog-post-768x506.jpg'
        },
        {
            'title': 'Sweeteners: Time to rethink your choices?',
            'url': 'https://www.health.harvard.edu/blog/sweeteners-time-to-rethink-your-choices-2019022215967',
            "summary": "When it comes to low-calorie sweeteners, you have a lot of choices. Theres the blue one, the pink one, the yellow one, or the green one. Stevia is considered a natural non-caloric sweetener. Saccharin and sucralose are considered non-nutritive sweeteners (few or no calories). Aspartame is a nutritive sweetener (adds some calories but far less than sugar). Over time, such empty calories can add up to many pounds of weight gain. Are there downsides to non-sugar sweeteners? Despite the rationale above, the effectiveness of using NSSs to lose weight, avoid weight gain, or achieve other health benefits is unproven. In fact, some studies (such as this one) found that people who often drank diet soda actually became obese more often than those who drank less diet soda or none. No clear health benefits were observed with NSS use, but potential harms could not be excluded. The quality of the research to date wasnt very good, and no definitive conclusions could be made regarding NSS use and these important health effects.",
            'img_url': 'https://hhp-blog.s3.amazonaws.com/2019/02/iStock-1037859810-640x427.jpg'
        }
    ]
};

exports.sendArticleLinkEmail = (article, name, email) => {
    /**
     * Send an email containing more information on an article, using SendGrid
     */

    sgMail.setApiKey(SENDGRID_API_KEY);
    const msg = {
        to: email,
        from: 'no-reply@vecgraph.com',
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
                .setDescription(articles[i]['summary'].substring(0, 80) + '...')
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

        if (explainableRelations && articles[i]["concepts"].length > 0) {
            //Add explanation for how article is related

            //Get the label of each concept
            let commonConcepts = articles[i]["concepts"].slice(0, 3);
            commonConcepts = commonConcepts.map(function (e) {
                return e['label']
            });

            //Case to structure the explanation
            let explanation = ``
            switch (commonConcepts.length) {
                case 1:
                    explanation = `${commonConcepts[0]}`
                    break;
                case 2:
                    explanation = `${commonConcepts[0]} and ${commonConcepts[1]}`
                    break;
                case 3:
                    explanation = `${commonConcepts[0]}, ${commonConcepts[1]}, and ${commonConcepts[2]}`
                    break;
            }

            speech.push(
                `
            <break time="0.5s"/>
            <say-as interpret-as="ordinal">${i + 1}</say-as> story: <break time="0.4s"/>
            ${articles[i]['title']} ${randomChoose(possibleTransistions)} ${explanation}
            `)

        } else {
            speech.push(
                `
            <break time="0.5s"/>
            <say-as interpret-as="ordinal">${i + 1}</say-as> story: <break time="0.4s"/>
            ${articles[i]['title']}
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




