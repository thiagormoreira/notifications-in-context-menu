import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as AppMenuModule from 'resource:///org/gnome/shell/ui/appMenu.js';
import Shell from 'gi://Shell';

const INJECTED_MARKER = '_notificationsInContextItems';

export default class NotificationsInContextMenuExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._originalOpen = null;
        this._patchedOpen = null;
    }

    _truncateText(text, maxLength) {
        if (!text) return '';
        let str = String(text);
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - 1) + '\u2026';
    }

    _normalizeAppId(id) {
        if (!id) return null;
        return String(id).replace(/\.desktop$/g, '').toLowerCase();
    }

    _getAppNotifications(app) {
        if (!app) return [];
        let appId = null;
        if (typeof app.get_id === 'function') {
            appId = app.get_id();
        }
        let appName = null;
        if (typeof app.get_name === 'function') {
            appName = app.get_name();
        }
        let messageTray = Main.messageTray;
        if (!messageTray || typeof messageTray.getSources !== 'function') {
            return [];
        }
        let sources = messageTray.getSources();
        let notifications = [];
        let normalizedAppId = this._normalizeAppId(appId);

        for (let i = 0; i < sources.length; i++) {
            let source = sources[i];
            let sourceApp = source.app ?? source._app ?? null;
            let sourceAppId = source.appId ?? source._appId ?? null;
            if (!sourceAppId && sourceApp && typeof sourceApp.get_id === 'function') {
                sourceAppId = sourceApp.get_id();
            }
            let sourceName = sourceApp && typeof sourceApp.get_name === 'function' ? sourceApp.get_name() : '';
            let match = false;

            if (sourceApp && app === sourceApp) {
                match = true;
            }

            let normalizedSourceId = this._normalizeAppId(sourceAppId);
            if (!match && normalizedAppId && normalizedSourceId) {
                if (normalizedSourceId === normalizedAppId) {
                    match = true;
                } else if (normalizedSourceId.includes(normalizedAppId) || normalizedAppId.includes(normalizedSourceId)) {
                    match = true;
                }
            }

            if (!match && appName && sourceName) {
                if (sourceName === appName) {
                    match = true;
                }
            }

            if (!match) {
                continue;
            }

            let sourceNotifications = null;
            if (Array.isArray(source.notifications)) {
                sourceNotifications = source.notifications;
            } else if (source._notifications && typeof source._notifications === 'object') {
                sourceNotifications = Object.values(source._notifications);
            }
            if (!sourceNotifications) {
                continue;
            }
            for (let j = 0; j < sourceNotifications.length; j++) {
                notifications.push(sourceNotifications[j]);
            }
        }
        return notifications;
    }

    _clearInjectedItems(menu) {
        let items = menu[INJECTED_MARKER];
        if (!items || items.length === 0) return;
        for (let i = 0; i < items.length; i++) {
            try {
                items[i].destroy();
            } catch (e) {}
        }
        menu[INJECTED_MARKER] = [];
    }

    _recordItem(menu, item) {
        if (!menu[INJECTED_MARKER]) menu[INJECTED_MARKER] = [];
        menu[INJECTED_MARKER].push(item);
        return item;
    }

    _injectNotificationsIntoMenu(menu, app) {
        if (!menu || !app) return;
        let notifications = this._getAppNotifications(app);

        const settings = this.getSettings();
        let maxVisible = settings.get_int('max-visible');
        let truncateLength = settings.get_int('truncate-length');
        let showClearAll = settings.get_boolean('show-clear-all');
        let showArea = settings.get_boolean('show-notifications-area');
        if (!showArea) return;

        let firstSeparator = new PopupMenu.PopupSeparatorMenuItem();
        menu.addMenuItem(firstSeparator);
        this._recordItem(menu, firstSeparator);
        let titleItem = new PopupMenu.PopupMenuItem('Notificações', { reactive: false, can_focus: false });
        if (titleItem.label && typeof titleItem.label.add_style_class_name === 'function') {
            titleItem.label.add_style_class_name('popup-menu-item-heading');
        }
        menu.addMenuItem(titleItem);
        this._recordItem(menu, titleItem);

        if (notifications.length === 0) {
            let emptyItem = new PopupMenu.PopupMenuItem('Nenhuma notificação', { reactive: false, can_focus: false });
            menu.addMenuItem(emptyItem);
            this._recordItem(menu, emptyItem);
            return;
        }
        if (maxVisible < 1) maxVisible = 1;
        if (maxVisible > 20) maxVisible = 20;

        let visibleCount = notifications.length > maxVisible ? maxVisible : notifications.length;
        for (let i = 0; i < visibleCount; i++) {
            let n = notifications[i];
            let title = n && n.title ? String(n.title) : '';
            let body = n && n.body ? String(n.body) : '';
            let labelText = title;
            if (body && body.trim().length > 0) {
                if (title && title.trim().length > 0) labelText = title + ' — ' + body;
                else labelText = body;
            }
            let item = new PopupMenu.PopupMenuItem(this._truncateText(labelText, truncateLength));
            item._notification = n;
            item.connect('activate', function(actor) {
                let notif = actor._notification;
                if (notif) {
                    try {
                        if (typeof notif.activate === 'function') notif.activate(null);
                        else if (typeof notif.open === 'function') notif.open();
                    } catch (e) {}
                }
                actor._notification = null;
            });
            menu.addMenuItem(item);
            this._recordItem(menu, item);
        }
        if (notifications.length > maxVisible) {
            let moreItem = new PopupMenu.PopupMenuItem('+' + (notifications.length - maxVisible) + ' mais...', { reactive: false, can_focus: false });
            menu.addMenuItem(moreItem);
            this._recordItem(menu, moreItem);
        }
        if (showClearAll && notifications.length > 0) {
            let separator = new PopupMenu.PopupSeparatorMenuItem();
            menu.addMenuItem(separator);
            this._recordItem(menu, separator);
            let clearItem = new PopupMenu.PopupMenuItem('Limpar todas as notificações');
            clearItem._notifications = notifications;
            clearItem.connect('activate', function(actor) {
                let list = actor._notifications;
                if (!list) return;
                for (let i = 0; i < list.length; i++) {
                    let n = list[i];
                    try { if (n && typeof n.destroy === 'function') n.destroy(); } catch (e) {}
                }
                actor._notifications = null;
            });
            menu.addMenuItem(clearItem);
            this._recordItem(menu, clearItem);
        }
    }

    _maybeInject(menu) {
        if (!menu) return;
        const src = menu.sourceActor;
        const app = menu._app ?? src?.app ?? src?._delegate?.app ?? src?._delegate?._app ?? null;
        if (!app || !(app instanceof Shell.App)) return;
        try {
            this._clearInjectedItems(menu);
            this._injectNotificationsIntoMenu(menu, app);
        } catch (e) {
        }
    }

    enable() {

        this._originalOpen = PopupMenu.PopupMenu.prototype.open;
        const originalOpen = this._originalOpen;
        const maybeInject = menu => this._maybeInject(menu);
        this._patchedOpen = function(...args) {
            try { maybeInject(this); } catch (e) {}
            return originalOpen.apply(this, args);
        };
        PopupMenu.PopupMenu.prototype.open = this._patchedOpen;
        this._originalAppMenuOpen = AppMenuModule.AppMenu.prototype.open;
        const originalAppMenuOpen = this._originalAppMenuOpen;
        this._patchedAppMenuOpen = function(...args) {
            try { maybeInject(this); } catch (e) {}
            return originalAppMenuOpen.apply(this, args);
        };
        AppMenuModule.AppMenu.prototype.open = this._patchedAppMenuOpen;
    }

    disable() {
        if (this._originalOpen && PopupMenu.PopupMenu.prototype.open === this._patchedOpen) {
            PopupMenu.PopupMenu.prototype.open = this._originalOpen;
        }
        if (this._originalAppMenuOpen && AppMenuModule.AppMenu.prototype.open === this._patchedAppMenuOpen) {
            AppMenuModule.AppMenu.prototype.open = this._originalAppMenuOpen;
        }
        this._originalOpen = null;
        this._patchedOpen = null;
        this._originalAppMenuOpen = null;
        this._patchedAppMenuOpen = null;
    }
}
