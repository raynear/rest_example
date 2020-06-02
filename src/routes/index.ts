import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { onlyUser } from "../auth";
import Book from '../models/book';

const router = Router();

router.get('/echo', (req: Request, res: Response) => {
	res.send(req.query);
});

// Books API
// GET ALL BOOKS
router.get('/api/books', onlyUser, (req: Request, res: Response) => {
	Book.find((err, books) => {
		if(err) return res.status(500).send({error: 'database failure'});
		res.json(books);
	});
});

// GET SINGLE BOOK
router.get('/api/books/:book_id', (req: Request, res: Response) => {
	Book.findOne({_id: req.params.book_id}, (err, book) => {
		if(err) return res.status(500).json({error: err});
        if(!book) return res.status(404).json({error: 'book not found'});
        res.json(book);
	});
});

// GET BOOK BY AUTHOR
router.get('/api/books/author/:author', (req: Request, res: Response) => {
	res.end();
});

// CREATE BOOK
router.post('/api/book', (req: Request, res: Response) => {
	const book = new Book();
	book.title = req.body.title;
	book.author = req.body.author;
	book.published_date = new Date(req.body.published_date);

	book.save((err:mongoose.Error) => {
		if(err) {
			console.log(err);
			res.json({result:0});
		}
		res.json({result:1});
	});
});

// UPDATE THE BOOK
router.put('/api/books/:book_id', (req: Request, res: Response) => {
	res.end();
});

// DELETE BOOK
router.delete('/api/books/:book_id', (req: Request, res: Response) => {
	res.end();
});

export default router;
