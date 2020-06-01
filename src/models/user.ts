import mongoose, { Schema, Document } from 'mongoose';
import jsonwebtoken from 'jsonwebtoken';

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({path:path.join(__dirname, "../rest.env")});

export interface IUser extends Document {
  provider: string,
  id: string,
	email: string,
  username: string,
  avatar: string,
  admin: boolean,
  moderator: boolean
}

const userSchema = new Schema({
  provider: { type: String },
	id: { type: String },
	email : { type: String },
  username: { type: String },
  avatar: { type: String },
  admin: { type: Boolean },
  moderator: { type: Boolean }
});

// userSchema.path('generateAuthToken').set()

export function generateAuthToken (id: string, admin: boolean, moderator: boolean) {
  const token = jsonwebtoken
    .sign(
      {
        id,
        admin: !!admin,
        moderator: !!moderator,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: '24h',
        audience: process.env.JWT_AUDIENCE as string,
        issuer: process.env.JWT_ISSUER as string,
        subject: id,
      }
    )
    .toString()
  return token
}

export function setGoogleAvatarSize (avatarUrl: string, size: number) {
  if (!avatarUrl) return null
  const baseUrl = avatarUrl.split('?')[0]
  return baseUrl + `?sz=${size}`
}

export function findByExternalID(provider: string, id: string) {
  return User.findOne({
    providers: {
      $elemMatch: { provider, id },
    },
  })
}

export function findByEmail(email: string) {
  return User.findOne({
    email,
  })
}

export function newUserObj(provider: string, profile: any) {
  let newUser
  if (provider === 'google') {
    newUser = {
      provider: 'google',
      id: profile.id,
      email: profile.emails[0].value,
      username: profile.name.name,
      avatar: ""
    }
    if (profile.photos[0].value) {
      newUser.avatar = profile.photos[0].value;/*{
        small: setGoogleAvatarSize(profile.photos[0].value, 32),
        medium: setGoogleAvatarSize(profile.photos[0].value, 64),
        large: setGoogleAvatarSize(profile.photos[0].value, 184),
      }*/
    }
  }
  return newUser
}

export function createUser(provider: string, profile: any) {
  const newUser = newUserObj(provider, profile)
  const user = new User(newUser)
  return user.save()
}

export async function findOrCreate(email: string, id: string, provider: string, profile: any) {
  try {
    let user;
    if (email) user = await findByEmail(email);
    if (!user) user = await findByExternalID(provider, id);
    if (!user) {
      user = await createUser(provider, profile);
    }
    const token = generateAuthToken(id, user.admin, user.moderator);
    return { user, token };
  } catch (e) {
    return Promise.reject(new Error(e))
  }
}

const User = mongoose.model<IUser>('User', userSchema);

export default User;