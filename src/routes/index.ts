import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Book from '../models/book';

const router = Router();

// GET ALL BOOKS
router.get('/', (req: Request, res: Response) => {
	res.send('Hello World!');
});

router.get('/echo', (req: Request, res: Response) => {
	res.send(req.query);
});

router.get('/api/books', (req: Request, res: Response) => {
	Book.find((err, books) => {
		if(err) return res.status(500).send({error: 'database failure'});
		console.log("test");
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
	console.log(req.body);
	console.log(new Date(req.body.published_date));
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
