"use strict";

const express = require("express");
const router = express.Router();
const accounting= require("accounting");
const lodash= require("lodash");
const db = require("../models");


// Passes rejected promises to the Express error handler instead of crashing Node.
const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

//index route
router.get("/", wrap(async (req, res, next) => {
  // fetching random 9 books to display in index page
  const allBooks = await db.Book.findAll({
    limit: 9,
    include: [db.Author]
  });
  const distinctCategory = await db.Book.aggregate("genre", "DISTINCT", { plain: false });

  const cartCount = await db.Cart.count();

  Promise.all([allBooks, distinctCategory, cartCount])
    .then((responses) => {
      lodash.map(responses[0], (response) => {
        const dataValues = response.dataValues;
        dataValues.price = accounting.formatMoney(dataValues.price);
        dataValues.modalhref = "#modal-book-" + dataValues.id;
        dataValues.modalId = "modal-book-" + dataValues.id;
        return response;
      });

      res.render("index", {
        books: responses[0],
        categories: responses[1],
        cartCount: responses[2],
      });
    })
    .catch(next);
}));


//category route
router.post("/category/:categoryName", (req, res, next) => {
  const booksByCategory = db.Book.findAll({
    where: {
      genre: req.body.genre,
    },
    include: [db.Author],
  });

  const distinctCategory = db.Book.aggregate("genre", "DISTINCT", { plain: false });

  const cartCount = db.Cart.count();

  Promise.all([booksByCategory, distinctCategory, cartCount])
    .then((responses) => {
      lodash.map(responses[0], (response) => {
        const dataValues = response.dataValues;
        dataValues.price = accounting.formatMoney(dataValues.price);
        dataValues.modalhref = "#modal-book-" + dataValues.id;
        dataValues.modalId = "modal-book-" + dataValues.id;
        return response;
      });

      res.render("category", {
        books: responses[0],
        categories: responses[1],
        cartCount: responses[2],
      });
    })
    .catch(next);
});

//cart route
router.get("/cart", wrap(async (req, res, next) => {
  const cartItems = await db.Cart.findAll({
    include: [
      {
        model: db.Book,
        through: {
          model: db.CartBook,
        },
      },
    ],
  });

  const distinctCategory = await db.Book.aggregate("genre", "DISTINCT", { plain: false });

  const cartCount = await db.Cart.count();

  const totalPrice = await db.Cart.sum("price");

  Promise.all([cartItems, distinctCategory, cartCount, totalPrice])
    .then((responses) => {
      const cart = lodash.map(responses[0], (response) => {
        const dataValues = response.dataValues;
        dataValues.price = accounting.formatMoney(dataValues.price);
        return response;
      });
      res.render("cart", {
        cart: cart,
        categories: responses[1],
        cartCount: responses[2],
        subTotal: responses[3],
      });
    })
    .catch(next);
}));

//gallery route
router.get("/gallery", wrap(async (req, res) => {
  res.render("gallery", {});
}));

(module.exports = router);