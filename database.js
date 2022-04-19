// This ensures that things do not fail silently but will throw errors instead.
"use strict";
// Require better-sqlite.
const Database = require('better-sqlite3');

//Connect to a db or create one if not exist yet
const db = new Database('log.db');