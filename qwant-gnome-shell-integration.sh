git clone https://github.com/al34034/Qwant-Gnome-shell-integration/ /tmp/qwant_gnome/
cp -R /tmp/qwant_gnome/Qwant_search@alex.nitters.eu/ ~/.local/share/gnome-shell/extensions/Qwant_search@alex.nitters.eu/
rm -rf /tmp/qwant_gnome/
gnome-shell-extension-tool -e Qwant_search@alex.nitters.eu
