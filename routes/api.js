/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;

const MongoClient = require("mongodb").MongoClient,
      ObjectId = require('mongodb').ObjectID,
      url = process.env.MONGO_URI,
      flagObj = {
        useNewUrlParser: true,
        useUnifiedTopology: true
      },
      database = "cluster0-vwptt"
;

const validateObjectId = id => {
  return /^[a-f0-9]{24}$/i.test(id);
};

module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res){
      MongoClient.connect(url, flagObj, (error, db) => {
        if (error) throw error;
        const dbo = db.db(database);
        dbo.collection("books").find().toArray((error, result) => {
          result.forEach(book => {
            book.commentcount = book.comments.length;
            delete book.comments;
          });
          res.send(result);
        });
      });
    })
    
    .post(function (req, res){
      const book = {};
      if (!(req.body.title)) return res.send("missing title");
      book.title = req.body.title.trim();
      book.comments = [];
      MongoClient.connect(url, flagObj, (error, db) => {
        if (error) throw error;
        const dbo = db.db(database);
        dbo.collection("books").insertOne(book, (error, result) => {
          if (error) throw error;
          book._id = result.insertedId;
          res.json(book);
          db.close();
        });
      });
      //response will contain new book object including atleast _id and title
    })
    
    .delete(function(req, res){
      MongoClient.connect(url, flagObj, (error, db) => {
        if (error) throw error;
        const dbo = db.db(database);
        dbo.collection("books").deleteMany({}, (error, result) => {
          if (error) throw error;
          console.log(result.deletedCount, "document(s) deleted!");
          db.close();
        });
      });
      //if successful response will be 'complete delete successful'
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      const query = {};
      if (!(validateObjectId(req.params.id))) return res.send(`Incorrect id format.`);
      query._id = new ObjectId(req.params.id);
      MongoClient.connect(url, flagObj, (error, db) => {
        if (error) throw error;
        const dbo = db.db(database);
        dbo.collection("books").findOne(query, (error, result) => {
          if (error) throw error;
          res.send(result);
        });
      });
    
    })
    
    .post(function(req, res){
      const query = {}, update = {};
      query._id = new ObjectId(req.params.id);
      update.comments = req.body.comment;
      if (!(query._id)) return res.send("missing title");
      MongoClient.connect(url, flagObj, (error, db) => {
        if (error) throw error;
        const dbo = db.db(database);
        if (update.comments) { 
          dbo.collection("books").findOneAndUpdate(query, {$push: update}, (error, result) => {
            if (error) throw error;
            result.value.comments.push(update.comments);
            res.send(result.value);
          });
        } else {
          dbo.collection("books").findOne(query, (error, result) => {
            if (error) throw error;
            res.send(result);
          });
        }
        db.close();
      });
    })
    
    .delete(function(req, res){
      const query = {};
      if (!(validateObjectId(req.params.id))) return res.send(`Incorrect id format.`);
      query._id = new ObjectId(req.params.id);
      MongoClient.connect(url, flagObj, (error, db) => {
        if (error) throw error;
        const dbo = db.db(database);
        dbo.collection("books").deleteOne(query, (error, result) => {
          if (error) return res.send(`could not delete ${query._id}`);
          res.send(`delete successful`);
        });
        db.close();
      });
    });
  
};
