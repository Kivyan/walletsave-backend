import nodemailer from 'nodemailer';
import { User } from '@shared/schema';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

type EmailConfig = {
  service?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized?: boolean;
  };
};

// Criação do transporte para envio de emails
let transporter: nodemailer.Transporter;

// Função que inicializa o transporter do Nodemailer
export async function initializeEmailService() {
  if (transporter) {
    return transporter;
  }

  try {
    // Verifica se as credenciais estão disponíveis no ambiente
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    // Se não tiver credenciais ou estiver em ambiente de desenvolvimento, usa Ethereal
    if (!emailUser || !emailPassword) {
      return await setupEtherealTestAccount();
    }

    // Determina o serviço com base no domínio do email
    const emailDomain = emailUser.split('@')[1].toLowerCase();
    
    // Configurações para diferentes provedores de email
    let mailConfig: EmailConfig;

    if (emailDomain.includes('gmail.com')) {
      // Configuração para Gmail
      // Para o Gmail, é necessário usar uma "Senha de App" ou configurar OAuth2
      // https://nodemailer.com/usage/using-gmail/
      mailConfig = {
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPassword
        },
        tls: {
          rejectUnauthorized: false
        }
      };
      console.log('Configurando serviço de email com Gmail');
    } else if (emailDomain.includes('outlook.com') || emailDomain.includes('hotmail.com')) {
      // Configuração para Outlook/Hotmail
      mailConfig = {
        service: 'outlook',
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      };
      console.log('Configurando serviço de email com Outlook/Hotmail');
    } else if (emailDomain.includes('yahoo.com')) {
      // Configuração para Yahoo
      mailConfig = {
        service: 'yahoo',
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      };
      console.log('Configurando serviço de email com Yahoo');
    } else {
      // Configuração genérica para outros provedores
      mailConfig = {
        host: 'smtp.' + emailDomain,
        port: 587,
        secure: false, // true para 465, false para outras portas
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      };
      console.log(`Configurando serviço de email com provedor genérico (${emailDomain})`);
    }

    // Cria um transporter SMTP com as configurações determinadas
    transporter = nodemailer.createTransport(mailConfig as SMTPTransport.Options);

    // Verifica a conexão
    try {
      await transporter.verify();
      console.log('Conexão com o servidor de email estabelecida com sucesso!');
      console.log(`Serviço de email inicializado com a conta: ${emailUser}`);
    } catch (error) {
      console.error('Erro na conexão com o servidor de email real:', error);
      console.log('Usando conta de teste Ethereal como fallback...');
      return await setupEtherealTestAccount();
    }

    return transporter;
  } catch (error) {
    console.error('Erro ao inicializar serviço de email:', error);
    console.log('Tentando usar conta de teste Ethereal como último recurso...');
    return await setupEtherealTestAccount();
  }
}

// Configura uma conta de teste no Ethereal para emails de demonstração
async function setupEtherealTestAccount() {
  // Cria uma conta de teste no Ethereal
  const testAccount = await nodemailer.createTestAccount();
  
  // Cria um transporter SMTP para testes
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  
  console.log(`Serviço de email configurado com conta de TESTE: ${testAccount.user}`);
  console.log(`Visualize os emails em: https://ethereal.email/messages`);
  console.log(`Acesso: ${testAccount.user} | Senha: ${testAccount.pass}`);
  
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
    const emailUser = process.env.EMAIL_USER || (transporter as any)?.options?.auth?.user || 'noreply@walletsave.com';
    const fromName = "Wallet Save";
    
    const mailOptions = {
      from: `"${fromName}" <${emailUser}>`,
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

    console.log(`Email enviado para: ${email}`);
    console.log(`ID da mensagem: ${info.messageId}`);
    
    // Se for uma conta Ethereal (teste), ainda podemos fornecer a URL de preview
    const previewUrl = nodemailer.getTestMessageUrl(info) || '';
    if (previewUrl) {
      console.log(`Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      previewUrl: previewUrl,
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
