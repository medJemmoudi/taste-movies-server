const express = require('express');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const request = require('request');
const _ = require('lodash');

// instances
const app = express();
const tasteApi = 'https://tastedive.com/movies/like';
const rottenApi = 'https://www.rottentomatoes.com/m';

// Middlewares
app.use(bodyParser.json());

// Routes
app.post('/similar-to', (req, res) => {
	const movieTitle = req.body.title;

	request.get(`${tasteApi}/${movieTitle}`, function(error, response, data) {
		if (error) {
			throw error;
		}

		const $ = cheerio.load(data);
		const results = [];

		$('.tk-Resource').each((i, el) => {
			let currentEl = $(el);
		    results.push({
		    	poster: currentEl.find('meta[itemprop="image"]').attr('content'),
		    	title: currentEl.find('.tk-Resource-title').text(),
		    	year: currentEl.find('.tk-Resource-type').text(),
		    	likes: currentEl.find('.js-card-likes-counter').text(),
		    	rating: currentEl.find('.tk-Rating-score--resource-card').text().trim(),
		    });
		});

		res.status(200).json(results);
	});
});

app.post('/movie-details', (req, res) => {
	const movieTitle = _.snakeCase(req.body.title);

	request.get(`${rottenApi}/${movieTitle}`, function(error, response, data) {
		if (error) {
			throw error;
		}

		const $ = cheerio.load(data);
		const results = {
			synopsis: $('#movieSynopsis').text().trim(),
			comments: [],
		};

		$('ul.content-meta.info').children().each((i, li) => {
			let propName = $(li).find('.meta-label').text().replace(':', '');
			let propValue = $(li).find('.meta-value').text();
			results[_.snakeCase(propName)] = propValue
				.replace(/(\r\n\s|\n|\r)/gm, '')
				.replace(/(\s\s+)/gm, ' ')
				.trim();
		});

		$('li.quote_bubble').each((i, item) => {
			results.comments.push({
				author: $(item).find('p.quote_bubble__cite-author a').text().replace(/^\s+|\s+$/g, ''),
				message: $(item).find('blockquote p').text().replace(/^\s+|\s+$/g, '')
			});
		});

		$('.mop-audience-reviews__review-item').each((i, item) => {
			results.comments.push({
				author: $(item).find('.mop-audience-reviews__review--name').text().replace(/^\s+|\s+$/g, ''),
				message: $(item).find('.mop-audience-reviews__review--comment').text().replace(/^\s+|\s+$/g, '')
			});
		});

		res.status(200).json(results);
	});
});

app.listen(4000, () => console.log('server listening on port 4000...'));