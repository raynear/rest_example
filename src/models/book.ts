import mongoose, { Schema, Document } from 'mongoose';

export interface IBook extends Document {
	title: string,
	author: string,
	published_date: Date
}

const bookSchema = new Schema({
	title: { type: String },
	author: { type: String },
	published_date: { type: Date, default: Date.now }
});

const Book = mongoose.model<IBook>('Book', bookSchema);

export default Book;
