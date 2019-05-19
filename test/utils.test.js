const {urlFromTitle, getInitialContent} = require('../src/utils');

describe(`Testing util functions`, () => {

    test('Should get correct url from title', async () => {
        const articles = [
            {
                'title': 'Frozen treats: Navigating the options 1',
                'date': '7/22/2019',
                'url': 'https://www.health.har',
                'summary': 'When it’s my',
            },
            {
                'title': 'Frozen treats: Navigating the options 2',
                'date': '7/22/2019',
                'url': 'https://www.hea ...',
                'summary': 'When it’s my',
            }
        ];

        expect(urlFromTitle(articles, 'Frozen treats: Navigating the options 1')).toBe('https://www.health.har');

    });

    test('Should get some inital content', async () => {

        expect(getInitialContent().length).toBe(5);

    });

});