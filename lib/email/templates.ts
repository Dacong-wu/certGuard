/**
 * 生成单个证书过期通知邮件的HTML内容
 */
export function createCertificateExpiryEmailTemplate(
  domain: string,
  daysLeft: number,
  expiryDate: string
): string {
  const isCritical = daysLeft <= 7

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isCritical ? `紧急：${domain} 的 SSL 证书即将过期` : `警告：${domain} 的 SSL 证书即将过期`}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.5;
            color: #24292f;
            margin: 0;
            padding: 0;
            background-color: #f6f8fa;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .content {
            background: white;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            padding: 32px;
          }
          .title {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 16px;
            color: ${isCritical ? '#cf222e' : '#9a6700'};
          }
          .domain {
            font-weight: 600;
            color: #24292f;
          }
          .days {
            font-weight: 600;
            color: ${isCritical ? '#cf222e' : '#9a6700'};
          }
          .date {
            color: #57606a;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: #2da44e;
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 500;
            margin-top: 16px;
          }
          .footer {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #d0d7de;
            color: #57606a;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1 class="title">${isCritical ? `紧急：${domain} 的 SSL 证书即将过期` : `警告：${domain} 的 SSL 证书即将过期`}</h1>
            
            <p>您好，</p>
            <p>我们检测到您监控的域名 <span class="domain">${domain}</span> 的 SSL 证书将在 <span class="days">${daysLeft}</span> 天后过期。</p>
            <p class="date">过期日期：${expiryDate}</p>
            <p>请及时更新证书以避免服务中断。</p>            
          </div>
          
          <div class="footer">
            <p>此邮件由证书监控系统自动发送，请勿回复。</p>
            <p>如果您不想接收此类通知，可以在系统设置中关闭邮件通知。</p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * 生成批量证书过期通知邮件的HTML内容
 */
export function createBatchCertificateExpiryEmailTemplate(
  domains: Array<{
    domain: string
    daysLeft: number
    expiryDate: string
  }>
): string {
  const criticalDomains = domains.filter(d => d.daysLeft <= 7)
  const warningDomains = domains.filter(d => d.daysLeft > 7 && d.daysLeft <= 30)
  const hasCritical = criticalDomains.length > 0
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${hasCritical ? '紧急：多个域名的 SSL 证书即将过期' : '警告：多个域名的 SSL 证书即将过期'}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.5;
            color: #24292f;
            margin: 0;
            padding: 0;
            background-color: #f6f8fa;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .content {
            background: white;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            padding: 32px;
          }
          .title {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 16px;
            color: ${hasCritical ? '#cf222e' : '#9a6700'};
          }
          .domain-list {
            margin: 16px 0;
            padding: 0;
            list-style: none;
          }
          .domain-item {
            padding: 12px;
            border-bottom: 1px solid #d0d7de;
          }
          .domain-item:last-child {
            border-bottom: none;
          }
          .domain {
            font-weight: 600;
            color: #24292f;
          }
          .days {
            font-weight: 600;
            color: ${hasCritical ? '#cf222e' : '#9a6700'};
          }
          .date {
            color: #57606a;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background: #2da44e;
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 500;
            margin-top: 16px;
          }
          .footer {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #d0d7de;
            color: #57606a;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1 class="title">${hasCritical ? '紧急：多个域名的 SSL 证书即将过期' : '警告：多个域名的 SSL 证书即将过期'}</h1>
            
            <p>您好，</p>
            <p>我们检测到您监控的多个域名的 SSL 证书即将过期：</p>
            
            ${criticalDomains.length > 0 ? `
              <h3 style="color: #cf222e; margin-top: 16px;">紧急警告（7天内过期）</h3>
              <ul class="domain-list">
                ${criticalDomains.map(d => `
                  <li class="domain-item">
                    <span class="domain">${d.domain}</span>
                    <br>
                    <span class="days">剩余 ${d.daysLeft} 天</span>
                    <span class="date">过期日期：${d.expiryDate}</span>
                  </li>
                `).join('')}
              </ul>
            ` : ''}

            ${warningDomains.length > 0 ? `
              <h3 style="color: #9a6700; margin-top: 16px;">普通警告（30天内过期）</h3>
              <ul class="domain-list">
                ${warningDomains.map(d => `
                  <li class="domain-item">
                    <span class="domain">${d.domain}</span>
                    <br>
                    <span class="days">剩余 ${d.daysLeft} 天</span>
                    <span class="date">过期日期：${d.expiryDate}</span>
                  </li>
                `).join('')}
              </ul>
            ` : ''}
            
            <p>请及时更新这些域名的证书以避免服务中断。</p>
          </div>
          
          <div class="footer">
            <p>此邮件由证书监控系统自动发送，请勿回复。</p>
            <p>如果您不想接收此类通知，可以在系统设置中关闭邮件通知。</p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * 生成验证码邮件的HTML内容
 */
export function createVerificationCodeEmailTemplate(code: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #24292e; margin: 0;">证书监控系统</h1>
      </div>
      
      <div style="background-color: #f6f8fa; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
        <div style="font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #24292e; line-height: 1.2;">
          ${code.trim()}
        </div>
      </div>
      
      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e1e4e8; font-size: 12px; color: #6a737d; text-align: center;">
        <p>此验证码将在 5 分钟内有效，请尽快完成验证。</p>
        <p>此邮件由证书监控系统自动发送，请勿回复。</p>
        <p>如果您没有请求此验证码，请忽略此邮件。</p>
      </div>
    </div>
  `
}