import Dexie, { type Table } from 'dexie';
import { MindMapCoreState, IconName, UserTemplate } from './types';

export interface Project {
  id?: number;
  title: string;
  modifiedAt: Date;
  state: MindMapCoreState;
  icon?: IconName;
}

// By not subclassing, we avoid potential TypeScript 'this' context issues with the version() method.
// We create a Dexie instance and cast its type to include our table definition.
export const db = new Dexie('MindWeaverDB') as Dexie & {
  projects: Table<Project>;
  userTemplates: Table<UserTemplate>;
};

// Define the database schema.
db.version(2).stores({
  projects: '++id, title, modifiedAt', // Primary key ++id, index on title and modifiedAt
  userTemplates: '++id, title',
});

// Migration from version 1 to 2
db.version(1).stores({
  projects: '++id, title, modifiedAt'
});