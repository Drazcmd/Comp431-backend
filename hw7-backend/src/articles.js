const express = require('express')
const bodyParser = require('body-parser')
//Only needed for validating inputted ids as possible articleIds
const mongoose = require('mongoose')
const model = require('./model.js')
const isLoggedInMiddleware = require('./auth').isLoggedInMiddleware


exports.setup = function(app){
    app.use(bodyParser.json())
    app.get('/', hello)
    app.get('/articles/:id?', isLoggedInMiddleware, getArticles)
    app.post('/article', isLoggedInMiddleware, postArticle)
    app.put('/articles/:id', isLoggedInMiddleware, putArticles)
}

//Next week we'll need to account for images as well
//TODO - check which entry we should use: createdAt or the updatedAt (for date)
const formatArticleForAPI = (dbArticle) => ({
    id: dbArticle._id,
    author: dbArticle.author,
    text: dbArticle.text,
    date: dbArticle.createdAt,
    comments: dbArticle.comments
});

/**
 * Adds a new article to the list of articles, and returns the 
 * newly added article (not all the articles!). However, according
 * to the api specificaiton, even though it just sends one article back,
 * that article has to be wrapped in an array accessed by key 'articles'
 * On later assignments this will have to allow images (text only right now)
*/
const postArticle = (req, res) => {
    //see https://www.clear.rice.edu/comp431/data/database.html
    //near the bottom for why we no logner populate the 'id' field ourselvsss
    const newArticle = {
        author:req.userObj.username,
        text:req.body.text,
        comments: []
    }
    //since the schema has {timestamps: true} it'll automatically set
    //createdAt and updatedAt fields for us
    model.Article(newArticle).save()
    .then(response => {
        console.log('database response:', response) 
        //eventually we'll need to check if we must add an image in
        const returnedArticle = formatArticleForAPI(response)

        console.log('returned article:', returnedArticle)
        //note that wrapping it in an array is on purpose, not a bug!
        res.send({articles: [returnedArticle]})
    })
    .catch(err => {
        console.log(err)
        res.sendStatus(400)
    })
}

/*
 * On no id we just return everything, and according to the API on an id of an
 * author we return all articles by said author, and on an id of an
 * article we return just that article
 *
 * However, this week we can ignore authors/following stuff and just return the whole 
 * database whenever we receive a 'GET /articles'. So all we need to support
 * is /articles and /articles/id (where id can be a username or an article id)
*/
const getArticles = (req, res) => {
    console.log('getting the articles...')
    //This week only if an id is provided it HAS to be an article id, can't be a userId
    const id = req.params.id
    if (id && !model.isPossibleId(id)){
        //In this case, they gave us an id, but it doesn't fit the format of a valid article 
        //id since it isn't an _id mongoose might give to a docuemnt. We can simply return 
        //an empty array. Next week this will have to change, as it's likely a userId 
        console.log('provided id is invalid!')
        res.send({articles:[]})
    } else {
        //Now we know that either the id is a valid article id or doesn't exist at all,
        //These are both likely to return articles - either return all the articles in the
        //database, or a single article (if one with its id exists - otherwise none)
        //The empty {} for the find will get all articles in the database
        const databaseFilter = id && model.isPossibleId(id)
            ? {'_id': id}
            : {}
        model.Article.find(databaseFilter)
        .then(response => {
            console.log('got these articles back:', response)
            const returnedArticles = response.map(formatArticleForAPI)
            console.log('Formatted for the client, looks like this:', returnedArticles)
            res.send({articles: returnedArticles})
        })
        .catch(err => {
            console.log('Problem with database query?:', err)
            res.sendStatus(400)
        })
    }

}

/*
 * Diffeerent from POST article - this has to do with either editing article text
 * or positing or editing comments. That being said, it's only stubbed here
*/
const putArticles = (req, res) => res.send({
    articles: articles.filter(({id}) => !req.params.id || id == req.params.id) 
})

const hello = (req, res) => res.send({ hello: 'world' })