import { useTranslation } from "react-i18next";
import { LanguageSelector } from "./language-selector";
import { TranslatedText } from "./translated-text";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

/**
 * Componente de demonstração para testar a tradução
 */
export function LanguageDemo() {
  const { t } = useTranslation();
  
  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              <TranslatedText i18nKey="common.language_demo" tag="h2">
                Demonstração de Idiomas
              </TranslatedText>
            </CardTitle>
            <LanguageSelector />
          </div>
          <CardDescription>
            <TranslatedText i18nKey="common.select_language">
              Selecione seu idioma preferido
            </TranslatedText>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">
              <TranslatedText i18nKey="navigation.items">
                Itens de Navegação
              </TranslatedText>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="justify-start">
                <TranslatedText i18nKey="navigation.home">Início</TranslatedText>
              </Button>
              <Button variant="outline" className="justify-start">
                <TranslatedText i18nKey="navigation.wallet">Carteira</TranslatedText>
              </Button>
              <Button variant="outline" className="justify-start">
                <TranslatedText i18nKey="navigation.finance">Finanças</TranslatedText>
              </Button>
              <Button variant="outline" className="justify-start">
                <TranslatedText i18nKey="navigation.reports">Relatórios</TranslatedText>
              </Button>
              <Button variant="outline" className="justify-start">
                <TranslatedText i18nKey="navigation.savings">Poupança</TranslatedText>
              </Button>
              <Button variant="outline" className="justify-start">
                <TranslatedText i18nKey="navigation.profile">Perfil</TranslatedText>
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">
              <TranslatedText i18nKey="common.actions">
                Ações Comuns
              </TranslatedText>
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="default">
                <TranslatedText i18nKey="common.save">Salvar</TranslatedText>
              </Button>
              <Button size="sm" variant="secondary">
                <TranslatedText i18nKey="common.cancel">Cancelar</TranslatedText>
              </Button>
              <Button size="sm" variant="destructive">
                <TranslatedText i18nKey="common.delete">Excluir</TranslatedText>
              </Button>
              <Button size="sm" variant="outline">
                <TranslatedText i18nKey="common.edit">Editar</TranslatedText>
              </Button>
              <Button size="sm" variant="ghost">
                <TranslatedText i18nKey="common.add">Adicionar</TranslatedText>
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">
              <TranslatedText i18nKey="auth.section_title">
                Autenticação
              </TranslatedText>
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              <TranslatedText i18nKey="auth.slogan">
                Controle inteligente de gastos
              </TranslatedText>
            </p>
            <div className="flex gap-2">
              <Button variant="default">
                <TranslatedText i18nKey="auth.login">Entrar</TranslatedText>
              </Button>
              <Button variant="outline">
                <TranslatedText i18nKey="auth.register">Cadastrar</TranslatedText>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}