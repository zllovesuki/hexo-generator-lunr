var lunr    = require('lunr'),
	pathFn  = require('path'),
	fs      = require('fs'),
	moment  = require('moment'),
	striptags = require('striptags');

module.exports = function(locals){
	var config = this.config,
		lunrConfig = config.lunr,
		field = (lunrConfig.field||'').trim(),
		lunrPath = lunrConfig.path,
		posts = [],
		pages = [],
		items,
		res = {"all":[]},
		year1;

	switch(field){
		case '':
		case 'post':
			posts = locals.posts.sort('-date');
			break;
		case 'page':
			pages = locals.pages;
			break;
		case 'all':
			posts = locals.posts.sort('-date');
			pages = locals.pages;
			break;
	}//switch
	items = posts.data.concat(pages.data);

	//grouping
	items.forEach(function(post){
		year1 = moment(post.date).format('YYYY');
		if(!res[year1]){
			res[year1] = [post];
        } else {
			res[year1].push(post);
        }
		res.all.push(post);
	});

	//indexing
	var finalData = [],
		searchIdx,
        store = {},
        tags;
	for(var yearKey in res){
		searchIdx = lunr(function(){
			this.field('title', {boost:10});
			this.field('body');
			this.field('tags', {boost:100});
			this.ref('href');
		});
		res[yearKey].forEach(function(post){
            tags = [];
            if(post.tags){
                post.tags.each(function(tag){
                    tags.push(tag.name);
                });
            }
            searchIdx.add({
				title: post.title,
				desc: post.subtitle || "",
				body: striptags(post.content) || "",
				tags: tags.join(','),
				href: post.permalink
			});
            store[post.permalink] = {
                url:post.permalink,
                title: post.title,
                desc: post.subtitle||""
            };
		});
		finalData.push({
			path: pathFn.join(lunrPath, yearKey + ".json"),
			data: JSON.stringify({
				index: searchIdx.toJSON(),
				store: store
			})
		});
		store = {};
	}
	return finalData;
};
