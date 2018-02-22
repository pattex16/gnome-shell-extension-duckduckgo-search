# Qwant-Gnome-shell-integration
A Gnome-shell extension to be able to search Qwant directly from the overview (still under developement)
Only for Gnome 3.26+

Features : 
 - Get suggestions and search Qwant directly from the Overview.
 - Special suggestions (with icons) and Qwicks (access or search directly from websites using "&")
 - Adds a button to the top panel to launch Qwant directly

Screenshot:
![Screenshot](Qwant_search@alex.nitters.eu/Screen.png)

To come:
 - Results preview (Web, news, social) (may be a separate extension)
 - If you have other ideas, contact me at alex@nitters.eu
 
 How to install:
 ```git clone https://github.com/al34034/Qwant-Gnome-shell-integration/ ~/.local/share/gnome-shell/extensions/     //copy to extensions folder
 rm -f ~/.local/share/gnome-shell/extensions/README.md
 rm -f ~/.local/share/gnome-shell/extensions/LICENSE.txt    //cleanup
 gnome-shell-extension-tool -e Qwant_search@alex.nitters.eu     //enable extension```
