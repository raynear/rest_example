import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import dotenv from 'dotenv';
import path from 'path';

import auth from './auth';
import router from './routes';

const app = express();

dotenv.config({path:path.join(__dirname, "../rest.env")});

const db = mongoose.connection;

db.on('error', console.error);
db.once('open', () => {
	console.log("Connected to mongo server");
});
mongoose.connect('mongodb://localhost/rest', {useNewUrlParser: true, useUnifiedTopology: true});

// app.use(express.favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', auth);
app.use('/', router);

interface Err extends Error {
  status: number
  data?: any
}

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  const err = new Error('Not Found') as Err;
  err.status = 404;
  next(err);
});

// error handle
app.use((err: Err, req: Request, res: Response, next: NextFunction) => {
  // render the error page
  res.status(err.status || 500);
  res.json({
    message: err.message,
    data: err.data
  });
});


app.listen(3000, () => {
	console.log('rest app with oauth2.0 login');
});

export default app;
