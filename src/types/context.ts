import { Context } from 'grammy';
import { User } from './database';

export interface AgykeContext extends Context {
  dbUser?: User;
}
