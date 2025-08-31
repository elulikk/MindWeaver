import Dexie, { type Table } from 'dexie';
import { MindMapCoreState, IconName, UserTemplate } from './types';

export interface DBProject {
  id?: number;
  uuid: string;
  title: string;
  modifiedAt: Date;
  state: MindMapCoreState;
  icon?: IconName;
}

// By not subclassing, we avoid potential TypeScript 'this' context issues with the version() method.
// We create a Dexie instance and cast its type to include our table definition.
export const db = new Dexie('MindWeaverDB') as Dexie & {
  projects: Table<DBProject>;
  userTemplates: Table<UserTemplate>;
};

// Define the database schema.
db.version(3).stores({
  projects: '++id, title, modifiedAt, &uuid', // & makes uuid unique and indexed
  userTemplates: '++id, title',
}).upgrade(tx => {
  // This upgrade function will only run if the database version is less than 3.
  // It ensures all existing projects get a UUID.
  return tx.table('projects').toCollection().modify(project => {
    if (!project.uuid) {
      project.uuid = crypto.randomUUID();
    }
    if (project.state && !project.state.uuid) {
      project.state.uuid = project.uuid;
    }
  });
});

db.version(2).stores({
  projects: '++id, title, modifiedAt',
  userTemplates: '++id, title',
});

// Migration from version 1 to 2
db.version(1).stores({
  projects: '++id, title, modifiedAt'
});