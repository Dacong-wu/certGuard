// 导出基础邮件传输器
export { getTransporter, verifyEmailConfig, sendEmail } from './transporter'

// 导出证书通知相关功能
export { 
  sendCertificateExpiryEmail, 
  sendBatchCertificateExpiryEmail 
} from './certificate-notifications'

// 导出验证码邮件功能
export { sendVerificationCode } from './verification'

// 导出邮件模板函数，以便需要时直接使用
export {
  createCertificateExpiryEmailTemplate,
  createBatchCertificateExpiryEmailTemplate,
  createVerificationCodeEmailTemplate
} from './templates'