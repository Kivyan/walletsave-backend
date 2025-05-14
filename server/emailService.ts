import nodemailer from 'nodemailer';
import { User } from '@shared/schema';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import dns from 'dns';
import { promisify } from 'util';
import * as emailValidator from 'email-validator';
import EmailValidator from 'email-deep-validator';

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
  // Para debugging, podemos forçar reinicialização do transporter
  // descomentando a linha abaixo
  // transporter = undefined;
  
  if (transporter) {
    return transporter;
  }

  // Verifica se as credenciais estão disponíveis no ambiente
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    throw new Error('Credenciais de email não configuradas. Defina EMAIL_USER e EMAIL_PASSWORD.');
  }

  // Determina o serviço com base no domínio do email
  const emailDomain = emailUser.split('@')[1]?.toLowerCase() || '';
  
  // Para testes, podemos forçar um provedor específico, independente do domínio do email
  // Descomentar a linha abaixo e substituir pelo provedor desejado:
  // const forceProvider = 'outlook'; // 'gmail', 'outlook', 'yahoo', etc.
  // const providerToUse = forceProvider || emailDomain;
  
  // Configurações para diferentes provedores de email
  let mailConfig: EmailConfig;

  if (emailDomain.includes('gmail.com')) {
    // Configuração para Gmail
    // Para o Gmail, é necessário usar uma "Senha de App" ou configurar OAuth2
    // https://nodemailer.com/usage/using-gmail/
    mailConfig = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use TLS
      auth: {
        user: emailUser,
        pass: emailPassword
      },
      // Desative a validação de certificado para debug
      tls: {
        rejectUnauthorized: false
      }
    };
    console.log('Configurando serviço de email com Gmail (porta 465/SSL)');
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
    return transporter;
  } catch (error) {
    console.error('Erro na conexão com o servidor de email:', error);
    
    // Mensagem específica para erro de autenticação do Gmail
    if (emailDomain.includes('gmail.com') && error instanceof Error && error.message.includes('Username and Password not accepted')) {
      console.error(`\nERRO DE AUTENTICAÇÃO DO GMAIL: ${error.message}\n`);
      console.error(`IMPORTANTE: Para usar o Gmail, você precisa:\n1. Ativar a verificação em duas etapas na sua conta Google\n2. Criar uma "Senha de App" específica para este aplicativo em: https://myaccount.google.com/apppasswords\n`);
    }
    
    throw new Error(`Não foi possível conectar ao servidor de email: ${error instanceof Error ? error.message : String(error)}`);
  }
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

    console.log(`Email de verificação enviado para: ${email}`);
    console.log(`ID da mensagem: ${info.messageId}`);

    return {
      success: true,
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

// Função para verificar se um endereço de email existe
async function checkEmailExists(email: string): Promise<boolean> {
  try {
    console.log(`Iniciando verificação do email: ${email}`);
    
    // Criar instância do validador mais confiável
    const emailDeepValidator = new EmailValidator();
    
    // Verificação básica incluindo formato e domínio MX
    console.log(`Realizando verificação para: ${email}`);
    const { wellFormed, validDomain } = await emailDeepValidator.verify(email);
    
    // Registrando resultado da verificação
    console.log(`Verificação do email ${email}:
      Formato válido: ${wellFormed ? 'Sim' : 'Não'}
      Domínio válido (MX): ${validDomain ? 'Sim' : 'Não'}`);
    
    // Verificar apenas formato e domínio - são as verificações mais confiáveis
    if (!wellFormed || !validDomain) {
      console.log(`Email inválido (formato ou domínio): ${email}`);
      return false;
    }
    
    // Para todos os outros, assumimos que existe e deixamos 
    // a verificação por email (envio do código) como confirmação real
    
    // IMPORTANTE: Não tentamos verificar a existência da caixa postal via SMTP
    // porque muitos servidores bloqueiam essas verificações, causando falsos positivos
    
    // Extrair domínio e nome de usuário do email
    const [username, domain] = email.toLowerCase().split('@');
    
    // Verificar nome de usuário muito curto
    if (username.length < 3) {
      console.log(`Nome de usuário muito curto: ${username}`);
      return false;
    }
    
    // Verificar nomes de usuário obviamente genéricos
    const invalidUsernames = ['test', 'teste', 'admin', 'fake', 'example', 'exemplo'];
    if (invalidUsernames.includes(username.toLowerCase())) {
      console.log(`Nome de usuário genérico/de teste: ${username}`);
      return false;
    }
    
    // Domínios conhecidos
    const knownDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'];
    
    // Permitimos todos os emails que chegaram até aqui
    console.log(`Email com formato e domínio válidos: ${email}`);
    return true;
  } catch (error) {
    // Em caso de erro, permitimos o registro (evitando falsos positivos)
    console.error(`Erro na verificação do email ${email}: ${error instanceof Error ? error.message : String(error)}`);
    console.log(`Devido ao erro, permitindo com verificação por email: ${email}`);
    return true;
  }
}

// Verificar se um domínio de email é válido (de forma simples)
export async function verifyEmailDomain(email: string): Promise<{
  isValid: boolean;
  reason?: string;
  mailboxExists?: boolean;
}> {
  try {
    // Validar formato básico do email usando a biblioteca
    if (!emailValidator.validate(email)) {
      console.log(`Formato de email inválido: ${email}`);
      return { isValid: false, reason: 'Formato de email inválido', mailboxExists: false };
    }
    
    // Normalizar o email para minúsculas
    const normalizedEmail = email.toLowerCase();
    
    // Extrair o username e domínio do email
    const [username, domain] = normalizedEmail.split('@');
    console.log(`Verificando domínio de email: ${domain}`);
    
    if (!domain) {
      console.log('Formato de email inválido: domínio ausente');
      return { isValid: false, reason: 'Formato de email inválido', mailboxExists: false };
    }

    // Domínios obviamente inválidos - lista muito reduzida
    const fakeDomains = [
      'example.com', 'test.com', 'fake.com'
    ];
    
    if (fakeDomains.includes(domain)) {
      console.log(`Domínio obviamente inválido: ${domain}`);
      return { isValid: false, reason: 'Este domínio de email não é permitido para registro', mailboxExists: false };
    }

    // Para todos os outros domínios, consideramos válidos
    // A verificação real será feita pelo envio de email
    console.log(`Email aceito para verificação posterior: ${email}`);
    return { isValid: true, mailboxExists: true };
  } catch (error) {
    // Em caso de qualquer erro, permitimos o registro (o email será verificado depois)
    console.error('Erro ao verificar domínio de email:', error);
    return { isValid: true, reason: 'Permitindo registro com verificação por email', mailboxExists: true };
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

// Função para enviar email de recuperação de senha
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string
) {
  try {
    await initializeEmailService();

    // Configuração do email
    const emailUser = process.env.EMAIL_USER || (transporter as any)?.options?.auth?.user || 'noreply@walletsave.com';
    const fromName = "Wallet Save";
    
    // Cria uma URL de recuperação
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    
    // Determina se estamos em ambiente de desenvolvimento
    const isDevelopment = !process.env.APP_URL || process.env.APP_URL.includes('localhost') || process.env.APP_URL.includes('replit');
    
    // Texto adicional para ambiente de desenvolvimento
    const devNote = isDevelopment ? 
      `\n\nNOTA: Como você está em ambiente de desenvolvimento, o link completo pode não funcionar diretamente.\nSeu token de recuperação é: ${resetToken}\nVocê pode usar este token na página de recuperação de senha.` : '';
    
    const devHtmlNote = isDevelopment ? 
      `<div style="margin-top: 20px; padding: 15px; background-color: #fffbea; border-left: 4px solid #f59e0b; border-radius: 4px;">
        <p style="margin: 0; font-weight: bold; color: #92400e;">Ambiente de Desenvolvimento</p>
        <p style="margin-top: 8px; color: #92400e;">Como você está em ambiente de desenvolvimento, o link completo pode não funcionar diretamente.</p>
        <p style="margin-top: 8px; color: #92400e;">Seu token de recuperação é:</p>
        <code style="display: block; background-color: #fff8e6; padding: 8px; border-radius: 3px; margin-top: 8px; color: #92400e; word-break: break-all;">${resetToken}</code>
        <p style="margin-top: 8px; color: #92400e;">Você pode copiar este token e usá-lo na página de recuperação de senha.</p>
      </div>` : '';
    
    const mailOptions = {
      from: `"${fromName}" <${emailUser}>`,
      to: email,
      subject: 'Recuperação de Senha - Wallet Save',
      text: `Olá ${userName},\n\nRecebemos uma solicitação para recuperar sua senha. Clique no link abaixo ou copie-o para seu navegador para criar uma nova senha:\n\n${resetUrl}\n\nEste link expirará em 1 hora.${devNote}\n\nSe você não solicitou uma redefinição de senha, ignore este email.\n\nObrigado,\nEquipe Wallet Save`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4a5568;">Recuperação de Senha</h2>
          <p>Olá <strong>${userName}</strong>,</p>
          <p>Recebemos uma solicitação para recuperar sua senha.</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" style="background-color: #4a5568; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">Redefinir Senha</a>
          </div>
          <p>Ou copie o link abaixo para seu navegador:</p>
          <p style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all;">
            ${resetUrl}
          </p>
          <p style="color: #718096; font-size: 0.9em;">Este link expirará em 1 hora.</p>
          ${devHtmlNote}
          <p>Se você não solicitou uma redefinição de senha, ignore este email.</p>
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
            <p style="color: #718096; font-size: 0.8em;">
              Atenciosamente,<br>
              Equipe Wallet Save
            </p>
          </div>
        </div>
      `
    };

    // Envia o email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email de recuperação de senha enviado para: ${email}`);
    console.log(`ID da mensagem: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email de recuperação de senha:', error);
    throw new Error(`Não foi possível enviar o email de recuperação: ${error instanceof Error ? error.message : String(error)}`);
  }
}
