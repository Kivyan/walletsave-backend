import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, InsertCategory } from "@shared/schema";
import { DEFAULT_CATEGORIES } from "../client/src/lib/utils";
import { sendVerificationEmail, resendVerificationCode, verifyEmailDomain } from "./emailService";
import { log } from "./vite";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateVerificationCode() {
  // Gera um código de 6 dígitos para verificação
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateVerificationToken(email: string, code: string) {
  // Cria um token único combinando email, código e timestamp
  const timestamp = Date.now().toString();
  const data = `${email}-${code}-${timestamp}`;
  return createHash('sha256').update(data).digest('hex');
}

function generatePasswordResetToken(userId: number) {
  // Cria um token único para recuperação de senha
  const timestamp = Date.now().toString();
  const randomString = randomBytes(16).toString('hex');
  const data = `reset-${userId}-${timestamp}-${randomString}`;
  // Cria um token que inclui o timestamp de expiração (1 hora)
  const expiry = Date.now() + 3600000; // 1 hora em milissegundos
  const token = createHash('sha256').update(data).digest('hex');
  return { token, expiry };
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "expense-tracker-session-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        // Verificar se o usuário confirmou o email
        if (!user.isVerified) {
          return done(null, false, { message: 'Por favor, verifique seu email antes de fazer login' });
        }
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validar se o nome completo foi fornecido
      if (!req.body.fullName || req.body.fullName.trim().length < 3) {
        return res.status(400).json({ message: "Por favor, informe seu nome completo" });
      }
      
      // Validar se o email tem formato correto usando uma expressão regular simples
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.username)) {
        return res.status(400).json({ message: "Formato de email inválido" });
      }
      
      // Normalizar o email para minúsculas para verificações
      const lowerEmail = req.body.username.toLowerCase();
      
      // Não fazemos nenhuma outra validação além do formato básico
      // A verificação real será feita através do envio do código por email
      log(`Email com formato básico válido: ${req.body.username} - permitindo registro`);
      
      // A verificação real será feita quando o usuário receber e confirmar o código

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Este email já está cadastrado" });
      }

      // Gerar código de verificação
      const verificationCode = generateVerificationCode();
      
      // Criar usuário com código de verificação
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        verificationCode,
        isVerified: false,
      });

      // Criar categorias padrão para o novo usuário
      const defaultCategoriesPromises = DEFAULT_CATEGORIES.map(category => {
        const newCategory: InsertCategory = {
          name: category.name,
          color: category.color,
          icon: category.icon,
          userId: user.id
        };
        return storage.createCategory(newCategory);
      });
      
      // Aguardar a criação de todas as categorias padrão
      await Promise.all(defaultCategoriesPromises);

      // Enviar email de verificação
      try {
        const emailResult = await sendVerificationEmail(
          user.username,
          verificationCode,
          user.fullName
        );
        
        if (emailResult.success) {
          log(`Email de verificação enviado com sucesso para ${user.username}`);
        } else {
          log(`Falha ao enviar email de verificação: ${emailResult.error}`);
        }
      } catch (error) {
        log(`Erro ao enviar email de verificação: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Ao invés de fazer login, primeiro exigimos a verificação
      // Não enviamos o código na resposta, pois ele será enviado por email
      res.status(201).json({
        message: "Conta criada com sucesso! Por favor, verifique seu email para obter o código de verificação.",
        userId: user.id,
        email: user.username
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    try {
      // Verificar se existe um usuário com o email fornecido
      const userCheck = await storage.getUserByUsername(req.body.username);
      
      // Se existe o usuário mas não está verificado
      if (userCheck && !userCheck.isVerified && await comparePasswords(req.body.password, userCheck.password)) {
        // Gerar novo código de verificação
        const verificationCode = generateVerificationCode();
        
        // Atualizar o código no banco de dados
        await storage.updateUser(userCheck.id, {
          verificationCode
        });
        
        // Enviar novo email com código de verificação
        try {
          const emailResult = await resendVerificationCode(
            userCheck.username,
            verificationCode,
            userCheck.fullName
          );
          
          if (emailResult.success) {
            log(`Código de verificação enviado automaticamente durante login para ${userCheck.username}`);
          } else {
            log(`Falha ao enviar código durante login: ${emailResult.error}`);
          }
        } catch (error) {
          log(`Erro ao enviar código durante login: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        // Retornar erro 403 (não autorizado) com informações para mostrar o modal de verificação
        return res.status(403).json({
          needsVerification: true,
          message: "Por favor, verifique seu email antes de fazer login",
          userId: userCheck.id,
          email: userCheck.username
        });
      }
      
      // Continuar com a autenticação normal se não for o caso de email não verificado
      passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string } | undefined) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({
            message: info?.message || "Email ou senha inválidos"
          });
        }
        req.login(user, (err: Error | null) => {
          if (err) return next(err);
          res.status(200).json(req.user);
        });
      })(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err: Error | null) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Return user without password but include all other fields including role
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
  
  // Rota para deletar a conta do usuário
  app.delete("/api/user", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const userId = (req.user as SelectUser).id;
      
      // Efetua logout do usuário antes da exclusão
      req.logout((err: Error | null) => {
        if (err) return next(err);
        
        // Deleta o usuário e todos os seus dados
        storage.deleteUser(userId)
          .then(success => {
            if (success) {
              return res.status(200).json({ message: "Conta excluída com sucesso" });
            } else {
              return res.status(404).json({ message: "Usuário não encontrado" });
            }
          })
          .catch(error => {
            log(`Erro ao excluir usuário: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
          });
      });
    } catch (error) {
      log(`Erro na rota de exclusão de conta: ${error instanceof Error ? error.message : String(error)}`);
      next(error);
    }
  });

  app.put("/api/user", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = (req.user as SelectUser).id;
    const { password, ...updateData } = req.body;
    
    // If password is being updated, hash it
    const processUpdate = async () => {
      if (password) {
        const hashedPassword = await hashPassword(password);
        return { ...updateData, password: hashedPassword };
      }
      return updateData;
    };
    
    processUpdate()
      .then(data => storage.updateUser(userId, data))
      .then(user => {
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      })
      .catch(next);
  });
  
  // Nova rota para verificar o email
  app.post("/api/verify-email", async (req, res, next) => {
    try {
      const { userId, code } = req.body;
      
      if (!userId || !code) {
        return res.status(400).json({
          message: "Código de verificação ou ID de usuário inválido"
        });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({
          message: "Usuário não encontrado"
        });
      }
      
      if (user.isVerified) {
        return res.status(400).json({
          message: "Este email já foi verificado"
        });
      }
      
      if (user.verificationCode !== code) {
        return res.status(400).json({
          message: "Código de verificação inválido"
        });
      }
      
      // Verificar o usuário
      await storage.updateUser(userId, {
        isVerified: true,
        verificationCode: null
      });
      
      // Autenticar o usuário após verificação
      const updatedUser = await storage.getUser(userId);
      if (!updatedUser) {
        throw new Error("Erro ao buscar usuário após verificação");
      }
      
      req.login(updatedUser, (err: Error | null) => {
        if (err) return next(err);
        res.status(200).json({
          message: "Email verificado com sucesso!",
          user: req.user
        });
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Rota para reenviar código de verificação
  app.post("/api/resend-verification", async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          message: "Email não fornecido"
        });
      }
      
      const user = await storage.getUserByUsername(email);
      
      if (!user) {
        return res.status(404).json({
          message: "Usuário não encontrado"
        });
      }
      
      if (user.isVerified) {
        return res.status(400).json({
          message: "Este email já foi verificado"
        });
      }
      
      // Gerar novo código de verificação
      const verificationCode = generateVerificationCode();
      
      // Atualizar o código no banco de dados
      await storage.updateUser(user.id, {
        verificationCode
      });
      
      // Enviar email com o novo código de verificação
      try {
        const emailResult = await resendVerificationCode(
          user.username,
          verificationCode,
          user.fullName
        );
        
        if (emailResult.success) {
          log(`Novo código de verificação enviado com sucesso para ${user.username}`);
        } else {
          log(`Falha ao enviar novo código de verificação: ${emailResult.error}`);
        }
      } catch (error) {
        log(`Erro ao enviar novo código de verificação: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Não enviamos o código na resposta, pois ele será enviado por email
      res.status(200).json({
        message: "Um novo código de verificação foi enviado para seu email.",
        userId: user.id
      });
    } catch (error) {
      next(error);
    }
  });

  // Rota para solicitar redefinição de senha
  app.post("/api/reset-password-request", async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          message: "Email inválido"
        });
      }
      
      // Buscar usuário pelo email
      const user = await storage.getUserByUsername(email);
      
      // Por segurança, não informamos se o email existe ou não
      if (!user) {
        // Mesmo respondendo com sucesso, não enviamos email pois o usuário não existe
        return res.status(200).json({
          message: "Se este email estiver cadastrado, enviaremos um link de recuperação."
        });
      }
      
      // Gerar token de recuperação de senha
      const { token, expiry } = generatePasswordResetToken(user.id);
      
      // Atualizar o usuário com o token
      await storage.updateUser(user.id, {
        resetPasswordToken: token,
        resetPasswordExpires: new Date(expiry)
      });
      
      // Enviar email com o link de recuperação
      try {
        // Importando dinamicamente para evitar problemas de importação circular
        const { sendPasswordResetEmail } = await import("./emailService");
        
        await sendPasswordResetEmail(
          user.username,
          token,
          user.fullName
        );
        
        log(`Email de recuperação de senha enviado com sucesso para ${user.username}`);
      } catch (error) {
        log(`Erro ao enviar email de recuperação: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({
          message: "Erro ao enviar email de recuperação. Tente novamente mais tarde."
        });
      }
      
      res.status(200).json({
        message: "Se este email estiver cadastrado, enviaremos um link de recuperação."
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Rota para verificar token de recuperação de senha
  app.get("/api/reset-password/:token", async (req, res, next) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({
          message: "Token inválido"
        });
      }
      
      // Buscar todos os usuários (ineficiente, mas necessário para nosso modelo de dados atual)
      const allUsers = await storage.getAllUsers();
      
      // Encontrar usuário com o token correspondente
      const user = allUsers.find(u => u.resetPasswordToken === token);
      
      if (!user) {
        return res.status(404).json({
          message: "Token inválido ou expirado"
        });
      }
      
      // Verificar se o token está expirado
      if (user.resetPasswordExpires && new Date(user.resetPasswordExpires).getTime() < Date.now()) {
        return res.status(400).json({
          message: "Token expirado. Solicite um novo link de redefinição."
        });
      }
      
      // Token válido, retornar que é possível redefinir
      res.status(200).json({
        message: "Token válido",
        userId: user.id
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Rota para redefinir a senha
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({
          message: "Token ou senha inválidos"
        });
      }
      
      // Buscar todos os usuários (ineficiente, mas necessário para nosso modelo de dados atual)
      const allUsers = await storage.getAllUsers();
      
      // Encontrar usuário com o token correspondente
      const user = allUsers.find(u => u.resetPasswordToken === token);
      
      if (!user) {
        return res.status(404).json({
          message: "Token inválido ou expirado"
        });
      }
      
      // Verificar se o token está expirado
      if (user.resetPasswordExpires && new Date(user.resetPasswordExpires).getTime() < Date.now()) {
        return res.status(400).json({
          message: "Token expirado. Solicite um novo link de redefinição."
        });
      }
      
      // Gerar hash da nova senha
      const hashedPassword = await hashPassword(password);
      
      // Atualizar senha e limpar token
      await storage.updateUser(user.id, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      });
      
      res.status(200).json({
        message: "Senha redefinida com sucesso."
      });
    } catch (error) {
      next(error);
    }
  });
}
