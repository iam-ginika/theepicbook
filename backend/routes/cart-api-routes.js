"use strict";

const db = require("../models");

// Passes rejected promises to the Express error handler instead of crashing Node.
const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

module.exports = function (app) {
  app.post("/api/cart", wrap(async function (req, res) {
    const book = await db.Book.findByPk(req.body.bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const cart = await db.Cart.create({
      price: book.dataValues.price
    });

    await cart.addBook(book);
    res.json({
      ...cart.dataValues,
      book: book
    });
  }));

  app.get("/api/cart", wrap(async function (req, res) {
    const book = await db.Book.findByPk(req.body.bookId);
    const carts = await db.Cart.findAll({});
    res.json({
      cart: carts,
      book: book
    });
  }));

  app.delete("/api/cart/delete", wrap(async (req, res) => {
    await db.Cart.destroy({ where: {}, truncate: false });
    res.status(204).end();
  }));
};
