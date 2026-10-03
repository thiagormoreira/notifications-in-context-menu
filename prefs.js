import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const PIX_KEY = 'loganguns@gmail.com';
const KOFI_URL = 'https://ko-fi.com/loganguns';
const GITHUB_SPONSORS_URL = 'https://github.com/sponsors/thiagormoreira';

export default class NotificationsInContextMenuPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const meta = this.metadata;

        // General page
        const page = new Adw.PreferencesPage({
            title: 'General',
            iconName: 'preferences-system-symbolic',
        });
        window.add(page);

        const generalGroup = new Adw.PreferencesGroup({
            title: 'Behavior',
        });
        page.add(generalGroup);

        const maxVisibleRow = new Adw.SpinRow({
            title: 'Maximum visible notifications',
            subtitle: 'Maximum number of notifications shown in context menu',
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 20,
                step_increment: 1,
            }),
        });
        settings.bind('max-visible', maxVisibleRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        generalGroup.add(maxVisibleRow);

        const truncateRow = new Adw.SpinRow({
            title: 'Maximum text length',
            subtitle: 'Characters before truncating notification text',
            adjustment: new Gtk.Adjustment({
                lower: 20,
                upper: 200,
                step_increment: 5,
            }),
        });
        settings.bind('truncate-length', truncateRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        generalGroup.add(truncateRow);

        const clearAllRow = new Adw.SwitchRow({
            title: 'Show "Clear all notifications"',
            subtitle: 'Display option to clear all notifications for the app',
        });
        settings.bind('show-clear-all', clearAllRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        generalGroup.add(clearAllRow);

        const showAreaRow = new Adw.SwitchRow({
            title: 'Show notifications area',
            subtitle: 'Show the notifications section in app context menus, even when empty',
        });
        settings.bind('show-notifications-area', showAreaRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        generalGroup.add(showAreaRow);

        // About page
        const aboutPage = new Adw.PreferencesPage({
            title: 'About',
            iconName: 'dialog-information-symbolic',
        });
        window.add(aboutPage);

        const aboutGroup = new Adw.PreferencesGroup();
        aboutPage.add(aboutGroup);

        const titleRow = new Adw.ActionRow({
            title: 'Notifications in App Context Menu',
            subtitle: `v${meta.version ?? '1.0'}`,
        });
        aboutGroup.add(titleRow);

        const descRow = new Adw.ActionRow({
            title: 'Description',
            subtitle: 'Add pending notifications to app context menu in Dock/Dash and App Grid',
        });
        aboutGroup.add(descRow);

        const devRow = new Adw.ActionRow({
            title: 'Developer',
            subtitle: 'loganguns',
        });
        aboutGroup.add(devRow);

        const emailRow = new Adw.ActionRow({
            title: 'Email',
            subtitle: 'loganguns@gmail.com',
        });
        aboutGroup.add(emailRow);

        const licenseRow = new Adw.ActionRow({
            title: 'License',
            subtitle: 'MIT',
        });
        aboutGroup.add(licenseRow);

        // Support/Donations page
        const supportPage = new Adw.PreferencesPage({
            title: 'Support',
            iconName: 'help-browser-symbolic',
        });
        window.add(supportPage);

        const donationGroup = new Adw.PreferencesGroup({
            title: 'Support the Project',
            description: 'If this extension helps you, consider supporting its development',
        });
        supportPage.add(donationGroup);

        const pixRow = new Adw.ActionRow({
            title: 'PIX',
            subtitle: PIX_KEY,
        });
        const pixCopyButton = new Gtk.Button({
            iconName: 'edit-copy-symbolic',
            valign: Gtk.Align.CENTER,
            cssClasses: ['flat'],
            tooltipText: 'Copy PIX key',
        });
        let pixResetTimeoutId = null;
        pixCopyButton.connect('clicked', () => {
            window.get_clipboard().set_text(PIX_KEY);
            pixRow.subtitle = 'Key copied!';
            if (pixResetTimeoutId) {
                GLib.source_remove(pixResetTimeoutId);
            }
            pixResetTimeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
                pixRow.subtitle = PIX_KEY;
                pixResetTimeoutId = null;
                return GLib.SOURCE_REMOVE;
            });
        });
        window.connect('close-request', () => {
            if (pixResetTimeoutId) {
                GLib.source_remove(pixResetTimeoutId);
                pixResetTimeoutId = null;
            }
            return false;
        });
        pixRow.add_suffix(pixCopyButton);
        donationGroup.add(pixRow);

        const kofiRow = new Adw.ActionRow({
            title: 'Ko-fi',
            subtitle: 'ko-fi.com/loganguns',
            activatable: true,
        });
        kofiRow.add_suffix(new Gtk.Image({ iconName: 'external-link-symbolic' }));
        kofiRow.connect('activated', () => {
            Gtk.show_uri(window, KOFI_URL, 0);
        });
        donationGroup.add(kofiRow);

        const sponsorsRow = new Adw.ActionRow({
            title: 'GitHub Sponsors',
            subtitle: 'github.com/sponsors/thiagormoreira',
            activatable: true,
        });
        sponsorsRow.add_suffix(new Gtk.Image({ iconName: 'external-link-symbolic' }));
        sponsorsRow.connect('activated', () => {
            Gtk.show_uri(window, GITHUB_SPONSORS_URL, 0);
        });
        donationGroup.add(sponsorsRow);
    }
}
