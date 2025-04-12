import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

// 确保数据库目录存在
const dbDir = path.join(process.cwd(), 'db')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, 'certificate-monitor.db')
const db = new Database(dbPath)

// 初始化数据库表
function initDb() {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 验证码表
  db.exec(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)


  // 域名表
  db.exec(`
    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      domain TEXT NOT NULL,
      port INTEGER DEFAULT 443,
  
      last_checked TIMESTAMP,
      expiry_date TIMESTAMP,
      status TEXT,
      daysLeft INTEGER,
      notes TEXT,
  
      cert_serial TEXT,
      issuer_organization TEXT,
      issuer_country TEXT,
      issuer_common_name TEXT,
      cert_sha1_fingerprint TEXT,
      cert_sha256_fingerprint TEXT,
      cert_issue_date TIMESTAMP,
      cert_expiry_date TIMESTAMP,
      cert_file TEXT,
  
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, domain)
    );
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_domains_user_domain ON domains(user_id, domain);
  `)

  // 通知设置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      email_enabled BOOLEAN DEFAULT 1,
      warning_days INTEGER DEFAULT 30,
      critical_days INTEGER DEFAULT 7,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)
}

// 初始化数据库
initDb()

export default db
