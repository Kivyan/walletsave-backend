import nodemailer from 'nodemailer';
import { User } from '@shared/schema';

// Criação do transporte para envio de emails
// Estamos usando o serviço de teste Ethereal para desenvolvimento
// Em produção, você usaria suas configurações reais de SMTP
let transporter: nodemailer.Transporter;

// Função que inicializa o transporter do Nodemailer
export async function initializeEmailService() {
  if (transporter) {
    return transporter;
  }

  // Cria uma conta de teste no Ethereal
  // Isso é utilizado para testes e não envia emails reais
  // Os emails podem ser visualizados em https://ethereal.email
  const testAccount = await nodemailer.createTestAccount();

  // Cria um transporter SMTP
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log(`Serviço de email inicializado com a conta de teste: ${testAccount.user}`);
  console.log(`Visualize os emails enviados em: https://ethereal.email/messages`);
  console.log(`Login: ${testAccount.user} | Senha: ${testAccount.pass}`);

  return transporter;
}

// Função para enviar email de verificação
export async function sendVerificationEmail(
  email: string,
  verificationCode: string,
  userName: string
) {
  try {
    await initializeEmailService();

    // Configuração do email
    const mailOptions = {
      from: '"Wallet Save" <noreply@walletsave.com>',
      to: email,
      subject: 'Verifique seu email - Wallet Save',
      text: `Olá ${userName},\n\nSeu código de verificação é: ${verificationCode}\n\nInsira este código no aplicativo para confirmar seu email.\n\nObrigado,\nEquipe Wallet Save`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4a5568;">Confirmação de Email</h2>
          <p>Olá <strong>${userName}</strong>,</p>
          <p>Obrigado por se cadastrar no Wallet Save! Para completar seu registro, por favor insira o código abaixo no aplicativo:</p>
          <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #4a5568; margin: 0;">${verificationCode}</h1>
          </div>
          <p>Se você não solicitou esta verificação, por favor ignore este email.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #718096; font-size: 13px;">
            <p>Wallet Save - Organize suas finanças de forma simples e eficiente</p>
          </div>
        </div>
      `,
    };

    // Envio do email
    const info = await transporter.sendMail(mailOptions);

    console.log(`Email enviado: ${info.messageId}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);

    return {
      success: true,
      previewUrl: nodemailer.getTestMessageUrl(info),
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// Função para reenviar o código de verificação
export async function resendVerificationCode(
  email: string,
  verificationCode: string,
  userName: string
) {
  return sendVerificationEmail(email, verificationCode, userName);
}
