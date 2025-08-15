'use server'

import type { DomainInfo } from '@/types'
import db from '@/lib/db'
import { calculateDaysLeft, getStatusFromDaysLeft } from '@/lib/utils'
import https from 'https'
import { TLSSocket } from 'tls'

interface CertificateInfo {
  expiryDate: Date
  issueDate: Date
  cert: {
    serial: string
    sha1Fingerprint: string
    sha256Fingerprint: string
    file: string
    issuer: {
      organization: string
      country: string
      commonName: string
    }
  }
}

type AddDomainsBulkResult =
  | {
      success: true
      added: number
      failed: number
      errors: string[]
    }
  | {
      success: false
      error: string
    }

type GetDomainByIdResult =
  | {
      success: true
      domain: DomainInfo
    }
  | {
      success: false
      error: string
    }

// 初始化数据库
function initDatabase() {
  // 检查表是否存在
  const tableExists = db
    .prepare(
      `
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='domains'
  `
    )
    .get()

  // 如果表不存在，则创建
  if (!tableExists) {
    db.exec(`
      CREATE TABLE domains (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      domain TEXT NOT NULL,
      port INTEGER DEFAULT 443,
  
      last_checked TIMESTAMP,
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
      )
    `)
    console.log('数据库表 domains 已创建')
  } else {
    console.log('数据库表 domains 已存在')
  }

  // 检查通知设置表是否存在
  const notificationTableExists = db
    .prepare(
      `
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='notification_settings'
  `
    )
    .get()

  // 如果通知设置表不存在，则创建
  if (!notificationTableExists) {
    console.log('dedede')
    db.exec(`
      CREATE TABLE notification_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        email_enabled BOOLEAN NOT NULL DEFAULT 1,
        warning_days INTEGER NOT NULL DEFAULT 30,
        critical_days INTEGER NOT NULL DEFAULT 7,
        last_notified TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)
    console.log('数据库表 notification_settings 已创建')
  } else {
    console.log('数据库表 notification_settings 已存在')
  }
}

// 在文件开头调用初始化函数
initDatabase()

// 检查证书过期时间
export async function checkCertificate(
  domain: string,
  port: number
): Promise<CertificateInfo | null> {
  let retries = 3
  const baseTimeout = 5000

  while (retries-- > 0) {
    try {
      const result = await new Promise<CertificateInfo | null>(resolve => {
        const options = {
          host: domain,
          port: port,
          method: 'GET',
          rejectUnauthorized: false,
          servername: domain,
          timeout: baseTimeout + (3 - retries) * 2000, // 渐进超时
          agent: new https.Agent({ keepAlive: false })
        }

        console.log(
          `开始第${3 - retries}次证书检查: ${domain}:${port} 超时:${
            options.timeout
          }ms`
        )

        const req = https.request(options, res => {
          try {
            const cert = (res.socket as TLSSocket).getPeerCertificate()

            if (!cert) {
              console.error(`未获取到证书: ${domain}:${port}`)
              resolve(null)
              return
            }

            if (!cert.valid_to || !cert.valid_from) {
              console.error(`证书有效期信息不完整: ${domain}:${port}`, {
                valid_to: cert.valid_to,
                valid_from: cert.valid_from
              })
              resolve(null)
              return
            }

            const certInfo: CertificateInfo = {
              expiryDate: new Date(cert.valid_to),
              issueDate: new Date(cert.valid_from),
              cert: {
                serial: cert.serialNumber || '未知',
                sha1Fingerprint: cert.fingerprint || '未知',
                sha256Fingerprint: cert.fingerprint256 || '未知',
                file: cert.raw
                  ? Buffer.from(cert.raw).toString('base64')
                  : '未知',
                issuer: {
                  organization: cert.issuer?.O || '未知',
                  country: cert.issuer?.C || '未知',
                  commonName: cert.issuer?.CN || '未知'
                }
              }
            }

            resolve(certInfo)
          } catch (error) {
            console.error(`处理证书信息时出错 ${domain}:${port}:`, error)
            resolve(null)
          }
        })

        req.on('error', error => {
          console.error(`检查证书失败 ${domain}:${port}:`, error)
          resolve(null)
        })

        req.on('timeout', () => {
          req.destroy()
          console.error(`检查证书超时 ${domain}:${port}`)
          resolve(null)
        })

        req.end()
      })

      if (result) return result
      await new Promise(resolve => setTimeout(resolve, 1000)) // 重试间隔
    } catch (error) {
      console.error(`第${3 - retries}次检查异常 ${domain}:${port}:`, {
        error: error instanceof Error ? error : new Error(String(error))
      })
    }
  }
  return null
}

// 添加单个域名
export async function addDomain(
  userId: number,
  domain: string,
  port = 443,
  notes = ''
) {
  try {
    // 检查用户是否存在
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
    if (!user) {
      return { success: false, error: '用户不存在' }
    }

    // 检查域名是否已存在
    const existing = db
      .prepare(
        'SELECT * FROM domains WHERE user_id = ? AND domain = ? AND port = ?'
      )
      .get(userId, domain, port)

    if (existing) {
      return { success: false, error: '该域名和端口组合已存在' }
    }

    // 检查证书
    const certInfo = await checkCertificate(domain, port)
    if (!certInfo) {
      return { success: false, error: '无法获取证书信息' }
    }

    const daysLeft = calculateDaysLeft(certInfo.expiryDate)
    const status = getStatusFromDaysLeft(daysLeft)

    // 准备插入数据
    const values = [
      userId,
      domain,
      port,
      new Date().toISOString(),
      status,
      notes,
      certInfo.cert.serial,
      certInfo.cert.sha1Fingerprint,
      certInfo.cert.sha256Fingerprint,
      certInfo.issueDate.toISOString(),
      certInfo.expiryDate.toISOString(),
      certInfo.cert.file,
      certInfo.cert.issuer.organization,
      certInfo.cert.issuer.country,
      certInfo.cert.issuer.commonName
    ]

    // 添加域名
    const stmt = db.prepare(`
      INSERT INTO domains (
        user_id, domain, port, last_checked, status, notes,
        cert_serial, cert_sha1_fingerprint, cert_sha256_fingerprint,
        cert_issue_date, cert_expiry_date, cert_file,
        issuer_organization, issuer_country, issuer_common_name
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(...values)

    return { success: true, changes: result.changes }
  } catch (error) {
    console.error('添加域名失败:', error)
    return { success: false, error: '添加域名失败' }
  }
}

// 批量添加域名
export async function addDomainsBulk(
  userId: number,
  domainsText: string
): Promise<AddDomainsBulkResult> {
  try {
    const domains = domainsText.split('\n').filter(line => line.trim())
    const results = { successCount: 0, failed: 0, errors: [] as string[] }

    for (const line of domains) {
      let domain = line.trim()
      let port = 443

      if (domain.includes(':')) {
        const parts = domain.split(':')
        domain = parts[0].trim()
        port = Number.parseInt(parts[1].trim(), 10) || 443
      }

      const existing = db
        .prepare(
          'SELECT * FROM domains WHERE user_id = ? AND domain = ? AND port = ?'
        )
        .get(userId, domain, port)

      if (existing) {
        results.failed++
        results.errors.push(`${domain}:${port} 已存在`)
        continue
      }

      const certInfo = await checkCertificate(domain, port)
      if (!certInfo) {
        results.failed++
        results.errors.push(`${domain}:${port} 无法获取证书信息`)
        continue
      }

      const daysLeft = calculateDaysLeft(certInfo.expiryDate)
      const status = getStatusFromDaysLeft(daysLeft)

      db.prepare(
        `
        INSERT INTO domains (user_id, domain, port, last_checked, cert_expiry_date, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      ).run(
        userId,
        domain,
        port,
        new Date().toISOString(),
        certInfo.expiryDate.toISOString(),
        status
      )

      results.successCount++
    }

    if (results.successCount > 0) {
      return {
        success: true,
        added: results.successCount,
        failed: results.failed,
        errors: results.errors
      }
    } else {
      return {
        success: false,
        error: '没有成功添加任何域名：\n' + results.errors.join('\n')
      }
    }
  } catch (error) {
    console.error('批量添加域名失败:', error)
    return {
      success: false,
      error: '批量添加域名失败'
    }
  }
}

// 获取单个域名信息
export async function getDomainById(id: number): Promise<GetDomainByIdResult> {
  try {
    const domain = db
      .prepare(
        `
      SELECT * FROM domains 
      WHERE id = ?
    `
      )
      .get(id) as DomainInfo | undefined

    if (!domain) {
      return {
        success: false,
        error: '域名不存在'
      }
    }

    return {
      success: true,
      domain: {
        ...domain,
        daysLeft: calculateDaysLeft(domain.cert_expiry_date),
        status:
          domain.status ||
          getStatusFromDaysLeft(calculateDaysLeft(domain.cert_expiry_date))
      }
    }
  } catch (error) {
    console.error('获取域名信息失败:', error)
    return {
      success: false,
      error: '获取域名信息失败'
    }
  }
}

// 更新域名信息
export async function updateDomain(
  id: number,
  data: { port: number; notes: string }
) {
  try {
    const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(id) as
      | DomainInfo
      | undefined
    if (!domain) {
      return {
        success: false,
        error: '域名不存在'
      }
    }

    // 检查端口是否已存在
    if (data.port !== domain.port) {
      const existing = db
        .prepare(
          'SELECT * FROM domains WHERE user_id = ? AND domain = ? AND port = ? AND id != ?'
        )
        .get(domain.user_id, domain.domain, data.port, id)

      if (existing) {
        return {
          success: false,
          error: '该端口已被其他域名使用'
        }
      }
    }

    // 更新域名信息
    const result = db
      .prepare(
        `
      UPDATE domains 
      SET port = ?, notes = ?
      WHERE id = ?
    `
      )
      .run(data.port, data.notes, id)

    return { success: true, changes: result.changes }
  } catch (error) {
    console.error('更新域名信息失败:', error)
    return {
      success: false,
      error: '更新域名信息失败'
    }
  }
}

const domainFieldMap: Record<string, keyof DomainInfo> = {
  域名: 'domain',
  端口: 'port',
  状态: 'status',
  备注: 'notes',
  最后检查时间: 'last_checked',
  证书序列号: 'cert_serial',
  '证书 SHA1 指纹': 'cert_sha1_fingerprint',
  '证书 SHA256 指纹': 'cert_sha256_fingerprint',
  证书颁发日期: 'cert_issue_date',
  证书过期日期: 'cert_expiry_date',
  颁发机构: 'issuer_organization',
  颁发国家: 'issuer_country',
  颁发者通用名: 'issuer_common_name'
}

// 导出域名数据
export async function exportDomains(userId: number) {
  try {
    const domains = db
      .prepare(
        `
        SELECT 
          domain, port, status, notes, last_checked,
          cert_serial, cert_sha1_fingerprint, cert_sha256_fingerprint,
          cert_issue_date, cert_expiry_date,
          issuer_organization, issuer_country, issuer_common_name
        FROM domains 
        WHERE user_id = ?
        ORDER BY domain ASC
      `
      )
      .all(userId) as DomainInfo[]

    const headers = Object.keys(domainFieldMap) // 使用统一映射表中的中文字段名

    const csvRows = [
      headers.join(','),
      ...domains.map(domain => {
        return headers
          .map(label => {
            const key = domainFieldMap[label]
            return `"${domain[key] ?? ''}"`
          })
          .join(',')
      })
    ]

    return {
      success: true,
      data: csvRows.join('\n')
    }
  } catch (error) {
    console.error('导出域名数据失败:', error)
    return {
      success: false,
      error: '导出域名数据失败'
    }
  }
}

// 导入域名数据
export async function importDomains(userId: number, csvData: string) {
  try {
    const rows = csvData.trim().split('\n')
    const headers = rows[0].split(',').map(h => h.replace(/"/g, '').trim())

    if (headers.length < 2) {
      return {
        success: false,
        error: 'CSV 格式不正确'
      }
    }

    const domains = rows.slice(1).map(row => {
      const values = row.split(',').map(v => v.replace(/^"|"$/g, '').trim())
      const domain: Partial<DomainInfo> = {}
      headers.forEach((header, i) => {
        // 获取字段映射
        const key = domainFieldMap[header] as keyof DomainInfo | undefined // 类型断言

        // 使用类型断言，确保 TypeScript 理解这个赋值是安全的
        if (key) {
          ;(domain[key] as string) = values[i] ?? ''
        }
      })
      return domain
    })

    db.exec('BEGIN TRANSACTION')

    try {
      for (const domain of domains) {
        if (!domain.domain || !domain.port) continue

        const existing = db
          .prepare(
            'SELECT * FROM domains WHERE user_id = ? AND domain = ? AND port = ?'
          )
          .get(userId, domain.domain, domain.port) as { id: number } | undefined

        if (existing) {
          db.prepare(
            `
            UPDATE domains SET
              status = ?, notes = ?, last_checked = ?,
              cert_serial = ?, cert_sha1_fingerprint = ?, cert_sha256_fingerprint = ?,
              cert_issue_date = ?, cert_expiry_date = ?,
              issuer_organization = ?, issuer_country = ?, issuer_common_name = ?
            WHERE id = ?
          `
          ).run(
            domain.status,
            domain.notes,
            domain.last_checked,
            domain.cert_serial,
            domain.cert_sha1_fingerprint,
            domain.cert_sha256_fingerprint,
            domain.cert_issue_date,
            domain.cert_expiry_date,
            domain.issuer_organization,
            domain.issuer_country,
            domain.issuer_common_name,
            existing.id
          )
        } else {
          db.prepare(
            `
            INSERT INTO domains (
              user_id, domain, port, status, notes,
              last_checked, cert_serial, cert_sha1_fingerprint,
              cert_sha256_fingerprint, cert_issue_date, cert_expiry_date,
              issuer_organization, issuer_country, issuer_common_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).run(
            userId,
            domain.domain,
            domain.port,
            domain.status,
            domain.notes,
            domain.last_checked,
            domain.cert_serial,
            domain.cert_sha1_fingerprint,
            domain.cert_sha256_fingerprint,
            domain.cert_issue_date,
            domain.cert_expiry_date,
            domain.issuer_organization,
            domain.issuer_country,
            domain.issuer_common_name
          )
        }
      }

      db.exec('COMMIT')

      return {
        success: true,
        message: `成功导入 ${domains.length} 个域名`
      }
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
  } catch (error) {
    console.error('导入域名数据失败:', error)
    return {
      success: false,
      error: '导入域名数据失败'
    }
  }
}

// 删除域名
export async function deleteDomain(userId: number, domainId: number) {
  try {
    // 检查用户是否存在
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
    if (!user) {
      return { success: false, error: '用户不存在' }
    }

    // 检查域名是否存在且属于该用户
    const domain = db
      .prepare('SELECT * FROM domains WHERE id = ? AND user_id = ?')
      .get(domainId, userId)
    if (!domain) {
      return { success: false, error: '域名不存在或无权删除' }
    }

    // 删除域名
    const result = db
      .prepare('DELETE FROM domains WHERE id = ? AND user_id = ?')
      .run(domainId, userId)

    return {
      success: result.changes > 0,
      error: result.changes === 0 ? '删除失败' : undefined
    }
  } catch (error) {
    console.error('删除域名失败:', error)
    return { success: false, error: '删除域名失败' }
  }
}

// 获取通知设置
export async function getNotificationSettings(userId: number) {
  try {
    const settings = db
      .prepare(
        `
      SELECT * FROM notification_settings 
      WHERE user_id = ?
    `
      )
      .get(userId) as
      | { email_enabled: boolean; warning_days: number; critical_days: number }
      | undefined

    if (!settings) {
      // 如果用户没有设置，创建默认设置
      db.prepare(
        `
        INSERT INTO notification_settings (user_id, email_enabled, warning_days, critical_days)
        VALUES (?, 1, 30, 7)
      `
      ).run(userId)

      return {
        success: true,
        settings: {
          email_enabled: true,
          warning_days: 30,
          critical_days: 7
        }
      }
    }

    return {
      success: true,
      settings: {
        email_enabled: Boolean(settings.email_enabled),
        warning_days: settings.warning_days,
        critical_days: settings.critical_days
      }
    }
  } catch (error) {
    console.error('获取通知设置失败:', error)
    return {
      success: false,
      error: '获取通知设置失败'
    }
  }
}

// 更新通知设置
export async function updateNotificationSettings(
  userId: number,
  emailEnabled: boolean,
  warningDays: number,
  criticalDays: number
) {
  try {
    const result = db
      .prepare(
        `
      INSERT INTO notification_settings (user_id, email_enabled, warning_days, critical_days)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        email_enabled = excluded.email_enabled,
        warning_days = excluded.warning_days,
        critical_days = excluded.critical_days
    `
      )
      .run(userId, emailEnabled ? 1 : 0, warningDays, criticalDays)

    return { success: true, changes: result.changes }
  } catch (error) {
    console.error('更新通知设置失败:', error)
    return {
      success: false,
      error: '更新通知设置失败'
    }
  }
}

type GetDomainsResult =
  | { success: true; domains: DomainInfo[] }
  | { success: false; error: string }

// 获取用户的所有域名
export async function getDomains(userId: number): Promise<GetDomainsResult> {
  try {
    const domains = db
      .prepare(
        `
        SELECT * FROM domains 
        WHERE user_id = ? 
        ORDER BY 
          CASE 
            WHEN status = 'error' THEN 1 
            WHEN status = 'warning' THEN 2 
            ELSE 3 
          END, 
          cert_expiry_date ASC
      `
      )
      .all(userId) as Omit<DomainInfo, 'daysLeft'>[] // 明确断言类型，但排除 `daysLeft`

    const result: DomainInfo[] = domains.map(domain => {
      const daysLeft = calculateDaysLeft(domain.cert_expiry_date)
      return {
        ...domain,
        daysLeft,
        status: domain.status || getStatusFromDaysLeft(daysLeft)
      }
    })

    return {
      success: true,
      domains: result
    }
  } catch (error) {
    console.error('获取域名列表失败:', error)
    return {
      success: false,
      error: '获取域名列表失败'
    }
  }
}

// 获取域名统计信息
export async function getDomainStats(userId: number): Promise<
  | {
      isSuccess: true
      total: number
      warning: number
      error: number
      success: number
    }
  | {
      isSuccess: false
      error: string
    }
> {
  try {
    const total = (
      db
        .prepare('SELECT COUNT(*) as count FROM domains WHERE user_id = ?')
        .get(userId) as { count: number }
    ).count

    const warning = (
      db
        .prepare(
          "SELECT COUNT(*) as count FROM domains WHERE user_id = ? AND status = 'warning'"
        )
        .get(userId) as { count: number }
    ).count

    const error = (
      db
        .prepare(
          "SELECT COUNT(*) as count FROM domains WHERE user_id = ? AND status = 'error'"
        )
        .get(userId) as { count: number }
    ).count

    const successCount = (
      db
        .prepare(
          "SELECT COUNT(*) as count FROM domains WHERE user_id = ? AND status = 'success'"
        )
        .get(userId) as { count: number }
    ).count

    return {
      isSuccess: true,
      total,
      warning,
      error,
      success: successCount
    }
  } catch (error) {
    console.error('获取域名统计信息失败:', error)
    return {
      isSuccess: false,
      error: '获取域名统计信息失败'
    }
  }
}
