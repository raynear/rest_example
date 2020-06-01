import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';

import router from './routes';
// import bookSchema from './models/book.ts';


const app = express();


const db = mongoose.connection;

db.on('error', console.error);
db.once('open', () => {
	console.log("Connected to mongod server");
});
mongoose.connect('mongodb://localhost/rest');

// const Book = mongoose.model('book', bookSchema);


interface Err extends Error {
  status: number
  data?: any
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/', router);

// catch 404 and forward to error handler
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const err = new Error('Not Found') as Err;
  err.status = 404;
  next(err);
});

// error handle
app.use((err: Err, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // render the error page
  res.status(err.status || 500);
  res.json({
    message: err.message,
    data: err.data
  });
});


app.listen(3000, () => {
	console.log('example app');
});

export default app;
