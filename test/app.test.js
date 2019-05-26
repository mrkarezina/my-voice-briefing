'use strict';
const {App, Util} = require('jovo-framework');
const {GoogleAssistant} = require('jovo-platform-googleassistant');
jest.setTimeout(5000);

//TODO: test unhandled intent

describe(`Testing Google Assistant Integration`, () => {

    const testSuite = new GoogleAssistant().makeTestSuite();

    test('Launch intent should contain welcome key', async () => {

        const conversation = testSuite.conversation({locale: 'keys-only'});

        const launchRequest = await testSuite.requestBuilder.launch();
        const responseLaunchRequest = await conversation.send(launchRequest);

        expect(
            responseLaunchRequest.getSpeech()
        ).toContain('welcome');

        expect(
            conversation.$user.$data.articles.length
        ).toBeGreaterThan(1);

        expect(
            conversation.$user.$data.selectedArticleIndex
        ).toBe(0);

        await conversation.clearDb();

    });

    test('Headlines list (InitialContentIntent)', async () => {

        const conversation = testSuite.conversation({locale: 'keys-only'});

        //To get the article data set up
        const launchRequest = await testSuite.requestBuilder.launch();
        const responseLaunchRequest = await conversation.send(launchRequest);

        const IntentRequest = await testSuite.requestBuilder.intent('InitialContentIntent');
        const responseIntentRequest = await conversation.send(IntentRequest);

        expect(
            responseIntentRequest.getSpeech()
        ).toContain('initial.articles');

        expect(
            responseIntentRequest.getSpeech()
        ).toContain('which.article');

        //Test for transitions
        expect(
            responseIntentRequest.getSpeech()
        ).toContain('<say-as interpret-as="ordinal">1</say-as> story');

        // Lists need to have more than one item or Google Error
        expect(
            conversation.$user.$data.articles.length
        ).toBeGreaterThan(1);

        await conversation.clearDb();

    });

    test('Test Ordinal Selection', async () => {

        const conversation = testSuite.conversation({locale: 'keys-only'});

        //To get the article data set up
        const launchRequest = await testSuite.requestBuilder.launch();
        await conversation.send(launchRequest);

        let IntentRequest = await testSuite.requestBuilder.intent('InitialContentIntent');
        await conversation.send(IntentRequest);

        IntentRequest = await testSuite.requestBuilder.intent('ThirdIntent');
        let responseIntentRequest = await conversation.send(IntentRequest);

        //Third article selected
        expect(
            conversation.$user.$data.selectedArticleIndex
        ).toBe(2);

        expect(
            conversation.$user.$data.isOrdinalSelection
        ).toBe(false);

        //See that speech regarding Article card is good
        expect(
            responseIntentRequest.getSpeech()
        ).toContain('summary.intro');


        await conversation.clearDb();

    });


    test('Test Unhandled ordinal selection, user not using ordinals to select', async () => {

        const conversation = testSuite.conversation({locale: 'keys-only'});

        //To get the article data set up
        const launchRequest = await testSuite.requestBuilder.launch();
        await conversation.send(launchRequest);

        let IntentRequest = await testSuite.requestBuilder.intent('InitialContentIntent');
        await conversation.send(IntentRequest);

        IntentRequest = await testSuite.requestBuilder.intent('Unhandled');
        let responseIntentRequest = await conversation.send(IntentRequest);

        //See that speech regarding Article card is good
        expect(
            responseIntentRequest.getSpeech()
        ).toContain('ordinal.selection.reprompt');

        IntentRequest = await testSuite.requestBuilder.intent('ThirdIntent');
        responseIntentRequest = await conversation.send(IntentRequest);

        //Third article selected
        expect(
            conversation.$user.$data.selectedArticleIndex
        ).toBe(2);

        expect(
            conversation.$user.$data.isOrdinalSelection
        ).toBe(false);

        //See that speech regarding Article card is good
        expect(
            responseIntentRequest.getSpeech()
        ).toContain('summary.intro');


        await conversation.clearDb();

    });


    test('On selecting title, test Article Info Intent', async () => {

        const conversation = testSuite.conversation({locale: 'keys-only'});
        conversation.$user.$data.selectedArticleIndex = 1;
        conversation.$user.$data.articles = testArticles;

        const IntentRequest = await testSuite.requestBuilder.intent('ArticleInfoIntent');
        const responseIntentRequest = await conversation.send(IntentRequest);

        //See that speech regarding Article card is good
        expect(
            responseIntentRequest.getSpeech()
        ).toMatch(`summary.intro Frozen treats: Navigating the options 2 <break time="0.5s"/>When it’s my<break time="0.7s"/> see.related`);


        await conversation.clearDb();

    });

    test('Test Article Info Intent, by using Launch intent instead of presenting', async () => {

        //Articles should now be set
        const conversation = testSuite.conversation({locale: 'keys-only'});
        const launchRequest = await testSuite.requestBuilder.launch();
        const responseLaunchRequest = await conversation.send(launchRequest);

        conversation.$user.$data.selectedArticleIndex = 1;

        const IntentRequest = await testSuite.requestBuilder.intent('ArticleInfoIntent');
        const responseIntentRequest = await conversation.send(IntentRequest);

        //See that speech regarding Article card contains CMS text
        expect(
            responseIntentRequest.getSpeech()
        ).toContain('see.related');

        await conversation.clearDb();

    });

    /**
     * Turn off Email sending function when running this test
     * @type {Conversation}
     */
    test('Email article intent', async () => {


        const conversation = testSuite.conversation({locale: 'keys-only'});
        conversation.$user.$data.selectedArticleIndex = 2;
        conversation.$user.$data.articles = testArticles;

        let IntentRequest = await testSuite.requestBuilder.intent('ArticleInfoIntent');
        await conversation.send(IntentRequest);

        conversation.$user.$data.accountData = {
            "given_name": "Marko",
            "email": "mrk.arezina@gmail.com"
        };

        //Test send email
        IntentRequest = await testSuite.requestBuilder.intent('EmailArticleLinkIntent');
        const responseIntentRequest = await conversation.send(IntentRequest);
        expect(
            responseIntentRequest.getSpeech()
        ).toContain('email.sent.confirmation');


        IntentRequest = await testSuite.requestBuilder.intent('NextStory');
        await conversation.send(IntentRequest);

        //Expect one increase
        expect(
            conversation.$user.$data.selectedArticleIndex
        ).toBe(3);

        await conversation.clearDb();

    });

    test('Next article intent', async () => {

        const conversation = testSuite.conversation({locale: 'keys-only'});
        conversation.$user.$data.selectedArticleIndex = 1;
        conversation.$user.$data.articles = testArticles;

        let IntentRequest = await testSuite.requestBuilder.intent('ArticleInfoIntent');
        await conversation.send(IntentRequest);

        IntentRequest = await testSuite.requestBuilder.intent('NextStory');
        await conversation.send(IntentRequest);

        //Expect one increase
        expect(
            conversation.$user.$data.selectedArticleIndex
        ).toBe(2);

        await conversation.clearDb();

    });

    test('Test Help menu. See if help menu turns true, and turns false after', async () => {

        const conversation = testSuite.conversation({locale: 'keys-only'});
        //Simulate launch
        conversation.$user.$data.articles = testArticles;

        //To simulate the HelpIntent Redirect
        conversation.$user.$data.isHelp = true;

        const IntentRequest = await testSuite.requestBuilder.intent('InitialContentIntent');
        const responseIntentRequest = await conversation.send(IntentRequest);

        //See that speech regarding Article card contains CMS text
        expect(
            responseIntentRequest.getSpeech()
        ).toContain('help.menu');

        //See that speech regarding Article card contains CMS text
        expect(
            conversation.$user.$data.isHelp
        ).toBe(false);

        await conversation.clearDb();


    });

});


const testArticles = [
    {
        'title': 'Frozen treats: Navigating the options 1',
        'date': '7/22/2019',
        'url': 'https://www.health.harvard.edu/blog/frozen-treats-navigating-the-options-2019030116092',
        'summary': 'When it’s my',
        'img_url': 'https://hhp-blog.s3.amazonaws.com/2018/09/IMG_6180_Edit-1024x768.png'

    },
    {
        'title': 'Frozen treats: Navigating the options 2',
        'date': '7/22/2019',
        'url': 'https://www.health.harvard.edu/blog/frozen-treats-navigating-the-options-2019030116092',
        'summary': 'When it’s my',
        'img_url': 'https://hhp-blog.s3.amazonaws.com/2018/09/IMG_6180_Edit-1024x768.png'
    },
    {
        'title': 'Frozen treats: Navigating the options 3',
        'date': '7/22/2019',
        'url': 'https://www.health.harvard.edu/blog/frozen-treats-navigating-the-options-2019030116092',
        'summary': 'When it’s my',
        'img_url': 'https://hhp-blog.s3.amazonaws.com/2018/09/IMG_6180_Edit-1024x768.png'
    },
    {
        'title': 'Frozen treats: Navigating the options 4',
        'date': '7/22/2019',
        'url': 'https://www.health.harvard.edu/blog/frozen-treats-navigating-the-options-2019030116092',
        'summary': 'When it’s my',
        'img_url': 'https://hhp-blog.s3.amazonaws.com/2018/09/IMG_6180_Edit-1024x768.png'
    },
    {
        'title': 'Frozen treats: Navigating the options 5',
        'date': '7/22/2019',
        'url': 'https://www.health.harvard.edu/blog/frozen-treats-navigating-the-options-2019030116092',
        'summary': 'When it’s my',
        'img_url': 'https://hhp-blog.s3.amazonaws.com/2018/09/IMG_6180_Edit-1024x768.png'
    }
];