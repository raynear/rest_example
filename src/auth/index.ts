import { Router, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';

import passport from 'passport';
import jwt from 'express-jwt';
import jsonwebtoken from 'jsonwebtoken';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import * as User from '../models/user';

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
  const { id } = profile;
  const email = profile.emails[0].value;
  const user = await User.findOrCreate(email, id, 'google', profile);
	return cb(null, user);
}));

export const onlyUser = async (req:Request, res:Response, next:NextFunction) => {
  // console.log("onlyUser", req.user);
  if(req.user && (req.user as any).name){
    next();
  } else if (req.cookies.refreshToken) {
    const accessToken = User.refreshAccessToken(req.cookies.refreshToken);
    res.cookie('accessToken', accessToken, {expires:new Date(Date.now() + 60*1000), httpOnly: true});
    const decoded = jsonwebtoken.verify(accessToken, process.env.JWT_SECRET as string) as any;
    req.user = decoded;
    next();
  } else {
    res.status(301).redirect('/login/google');
  }
};


export const onlyAdmin = async (req:Request, res:Response, next:NextFunction) => {
  // console.log("onlyAdmin", req.user);
  if(req.user && (req.user as any).admin){
    next();
  } else if (!req.user && req.cookies.refreshToken) {
    const accessToken = User.refreshAccessToken(req.cookies.refreshToken);
    res.cookie('accessToken', accessToken, {expires:new Date(Date.now() + 60*1000), httpOnly: true});
    const decoded = jsonwebtoken.verify(accessToken, process.env.JWT_SECRET as string) as any;
    req.user = decoded;
    next();
  } else {
    res.status(301).send('not authorized');
  }
};

const jwtParser = jwt({
  credentialsRequired: false,
  secret: process.env.JWT_SECRET as string,
  issuer: process.env.JWT_ISSUER as string,
  getToken: (req:Request) => {
    if (req.cookies.accessToken) return req.cookies.accessToken;
    return null;
  },
})

// Make Apollo Server handle the unauthenticated users and not Express
function handleJwtError (err:any, req:Request, res:Response, next:NextFunction) {
  if (err.code === 'invalid_token') return next()
  return next(err)
}



auth.use(passport.initialize());

auth.use('/', jwtParser, handleJwtError);

// Social Login
auth.get('/', onlyUser, async (req: Request, res: Response) => {
  // console.log("user info", req.user);
	res.render('profile', req.user);
});

auth.get('/admin', onlyAdmin, (req: Request, res: Response) => {
	res.send('Hello Admin!');
});

auth.get('/login/google', (req: Request, res: Response, next:NextFunction) => {
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

auth.get('/login/google/callback', passport.authenticate('google', {
    failureRedirect: '/login/google',
    session: false
  }),
  (req:Request, res:Response, next:NextFunction) => {
    // console.log("callback", req.user);
    const accessToken = (req.user as any).accessToken;
    const refreshToken = (req.user as any).refreshToken;
    res.cookie('accessToken', accessToken, {expires:new Date(Date.now() + 60*1000), httpOnly: true});
    res.cookie('refreshToken', refreshToken, {expires:new Date(Date.now() + 14*24*60*60*1000), httpOnly: true});
    res.redirect('/');
  });

auth.get('/logout', (req: Request, res: Response) => {
  res.cookie('accessToken', '', {expires: new Date(Date.now()-42), httpOnly:true});
  res.cookie('refreshToken', '', {expires: new Date(Date.now()-42), httpOnly:true});
  res.send('successfully logout');
});

export default auth;