import { Router, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';

import passport from 'passport';
// import session from 'express-session';
// import jwt from 'express-jwt';
import jsonwebtoken  from 'jsonwebtoken';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import * as User from '../models/user';
// import User from '../models/user';

const auth = Router();

dotenv.config({path:path.join(__dirname, "../../rest.env")});

// console.log("google id", process.env.GOOGLE_CLIENT_ID);
// console.log("google secret", process.env.GOOGLE_CLIENT_SECRET);

const googleId:string = process.env.GOOGLE_CLIENT_ID as string;
const googleSecret:string = process.env.GOOGLE_CLIENT_SECRET as string;

passport.use(new GoogleStrategy({
	clientID: googleId,
	clientSecret: googleSecret,
	callbackURL: "http://localhost:3000/login/google/callback"
},
async (accessToken:string, refreshToken:string, profile:any, cb:any) => {
  console.log("profile", profile);
  const { id } = profile;
  const email = profile.emails[0].value;
  const user = await User.findOrCreate(email, id, 'google', profile);
	return cb(null, user);
}));

passport.serializeUser((user, done) => {
  console.log("serialize", user);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  console.log("deserialize", user);
  done(null, user);
});

export const authenticateUser = (req:Request, res:Response, next:NextFunction) => {
  // console.log("auth request", req);
//  if (req.isAuthenticated()) {
  const token = req.cookies.token;
  console.log("cookies", req.cookies);
  console.log("token", token);
  const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET as string);
  console.log("decoded", decoded);
  if(decoded){
    next();
  } else {
    res.status(301).redirect('/login/google');
  }
};
/*
export const jwtParser = jwt({
  credentialsRequired: false,
  secret: process.env.JWT_SECRET as string,
  audience: process.env.JWT_AUDIENCE as string,
  issuer: process.env.JWT_ISSUER as string,
  getToken: req => {
    if (req.cookies.token) return req.cookies.token
    return null
  },
})
*/
// Make Apollo Server handle the unauthenticated users and not Express
export function handleJwtError (err:any, req:Request, res:Response, next:NextFunction) {
  if (err.code === 'invalid_token') return next()
  return next(err)
}

// auth.use(session({secret:process.env.SECRET_CODE as string, resave:true, saveUninitialized:false}));
auth.use(passport.initialize());
// auth.use(passport.session());
// console.log("google oauth", googleId, googleSecret);

// Social Login
auth.get('/', authenticateUser, (req: Request, res: Response) => {
  console.log("user info", req.user);
	res.render('profile', req.user);
});

auth.get('/login', authenticateUser, (req: Request, res: Response) => {
	res.send('Hello World!');
});

auth.get('/login/google', (req: Request, res: Response, next:NextFunction) => {
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

auth.get('/login/google/callback', passport.authenticate('google', {
    failureRedirect: '/login',
    session: false
  }),
  (req:Request, res:Response, next:NextFunction) => {
    console.log("request", req.user);
    const token = (<any>req.user).token;
    console.log("token", token);
    res.cookie('token', token, {expires:new Date(Date.now() + 7*24*60*60*1000), httpOnly: true});
    res.redirect('/');
  });

// auth.get('/login/google/callback', (req: Request, res: Response, next:NextFunction) => {
//   passport.authenticate('google', {
//   	failureRedirect: '/login',
// 		successRedirect: '/'
// 	})(req, res, next);
// });

// export authenticateUser;
export default auth;
