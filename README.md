# Notifications in App Context Menu (GNOME Shell Extension)

Uma extensão para GNOME Shell que adiciona as notificações pendentes no menu de contexto (clique direito) do ícone do app na Dock/Dash e no App Grid (Visão Geral > Aplicativos).

## Funcionalidades

- Mostra notificações pendentes no **menu de contexto da Dock/Dash** (clique direito no ícone do app)
- Mostra notificações pendentes no **App Grid** (Visão Geral > Aplicativos, clique direito no ícone do app)
- Agrupa por app (só exibe notificações do app clicado)
- Limite de 5 notificações visíveis por menu (mostra "+ N mais..." se houver mais)
- Botão "Limpar todas as notificações" por app
- Clique em uma notificação para abri-la/ativá-la
- Preserva o menu de contexto nativo do app

## Compatibilidade

- GNOME Shell 44–50

## Instalação (usuário local)

1. Copie esta pasta para:

```bash
~/.local/share/gnome-shell/extensions/notifications-in-context-menu@loganguns/
```

2. Ative com:

```bash
gnome-extensions enable notifications-in-context-menu@loganguns
```

3. Faça **logout/login** (necessário no Wayland após instalar/alterar)

Ou use o [Extension Manager](https://github.com/mjakeman/extension-manager) ou [extensions.gnome.org](https://extensions.gnome.org/).

## Desenvolvimento

Baseado nas [boas práticas](https://gjs.guide/extensions/review-guidelines/best-practices.html) de extensões GNOME Shell.

## Licença

MIT
