import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFreshDefaultData() {
  return {
    units: [],
    participants: [],
    sessions: [],
    staff_checkins: [],
    alerts: [],
    photo_hashes: [],
    audit_logs: []
  };
}

class JSONDatabase {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return { ...getFreshDefaultData(), ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error('Error reading DB file, initializing fresh:', err);
    }
    const fresh = getFreshDefaultData();
    this.save(fresh);
    return fresh;
  }

  save(data = this.data) {
    this.data = data;
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  }

  find(collectionName, query = {}) {
    const coll = this.data[collectionName] || [];
    return coll.filter(item => {
      for (const [key, val] of Object.entries(query)) {
        if (item[key] !== val) return false;
      }
      return true;
    });
  }

  findOne(collectionName, query = {}) {
    const items = this.find(collectionName, query);
    return items.length > 0 ? items[0] : null;
  }

  findById(collectionName, id) {
    const coll = this.data[collectionName] || [];
    return coll.find(item => item.id === id || item._id === id) || null;
  }

  insert(collectionName, doc) {
    if (!this.data[collectionName]) {
      this.data[collectionName] = [];
    }
    const item = { ...doc };
    if (!item.id && !item._id) {
      item.id = `id_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    this.data[collectionName].push(item);
    this.save();
    return item;
  }

  update(collectionName, id, updates) {
    const coll = this.data[collectionName] || [];
    const index = coll.findIndex(item => item.id === id || item._id === id);
    if (index !== -1) {
      coll[index] = { ...coll[index], ...updates };
      this.save();
      return coll[index];
    }
    return null;
  }

  remove(collectionName, id) {
    const coll = this.data[collectionName] || [];
    const filtered = coll.filter(item => item.id !== id && item._id !== id);
    this.data[collectionName] = filtered;
    this.save();
    return true;
  }

  count(collectionName, query = {}) {
    return this.find(collectionName, query).length;
  }

  reset() {
    this.save(getFreshDefaultData());
  }
}

export const db = new JSONDatabase();
