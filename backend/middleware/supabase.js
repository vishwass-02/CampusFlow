// Mocked Supabase client to allow local zero-configuration
const { readDb, writeDb, generateId } = require('../db');

const supabase = {
  from: (table) => {
    return {
      select: () => ({
        eq: () => ({
          single: async () => ({ data: {}, error: null }),
          order: async () => ({ data: [], error: null }),
          then: (res) => res({ data: [], error: null })
        }),
        order: async () => ({ data: [], error: null }),
        then: (res) => res({ data: [], error: null })
      }),
      insert: (payload) => {
        const data = Array.isArray(payload) ? payload[0] : payload;
        const db = readDb();
        if (!db[table]) db[table] = [];
        const item = { id: generateId(), ...data, created_at: new Date().toISOString() };
        db[table].push(item);
        writeDb(db);
        
        return {
          select: () => ({
            single: async () => ({ data: item, error: null }),
            then: (res) => res({ data: item, error: null })
          }),
          then: (res) => res({ data: item, error: null })
        };
      },
      update: (payload) => {
        return {
          eq: () => ({
            select: () => ({
              single: async () => ({ data: payload, error: null }),
              then: (res) => res({ data: payload, error: null })
            }),
            then: (res) => res({ data: payload, error: null })
          }),
          then: (res) => res({ data: payload, error: null })
        };
      },
      delete: () => {
        return {
          eq: async () => ({ error: null }),
          then: (res) => res({ error: null })
        };
      }
    };
  }
};

module.exports = { supabase };
