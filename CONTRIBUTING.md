# Code of conduct

Here are just a few basic rules when contributing to this project :
 - Be respectful of differing viewpoints and experiences
 - Accept constructive criticism without reacting negatively
 - Focus on what is best for the community
 - Show empathy and kindness towards other community members

**The following are strictly forbidden :**
 - **Use of bad language, swear words...**
 - **Trolling, insulting/derogatory comments, and personal or political attacks**
 - **Public or private harassment**
 - **Publishing others' private information, such as a physical or electronic address, without explicit permission**
 - **Other conduct which could reasonably be considered inappropriate in a professional setting**

# Contributing

Thank you very much for taking time to help with this project. Here are a few things you can do :

## Translating
If you want to translate the extension, please :
 - Copy one of the languages (the one you are the most comfortable with) from Qwant_search@alex.nitters.eu/locales.
 - Rename the folder and the .po file inside to the two-letter language code (ex `fr` for french or `en` for english)
 - Make your edits, using a text editor or Poedit.
 - Cd to the extension directory and run ```msgfmt locale/[language]/[language].po -o locale/[language]/LC_MESSAGES/Qwant_search@alex.nitters.eu.mo```
 - Create a pull request with your changes
 
 ## Reporting or fixing bugs
 If you find a bug, even if it is not important, please [open an issue](https://github.com/al34034/Qwant-Gnome-shell-integration/issues/new). Please also mark your issue with the `bug` label
 We would be very thankful if you could try and find the origin of the bug or even create a PR to suggest a fix.
 You can also help with existing bugs (especially thos marked with `help wanted`).
 
 ## Adding features
 If you want to add a feature, you can either [open an issue](https://github.com/al34034/Qwant-Gnome-shell-integration/issues/new) and label it `enhancement`.
 If you have enough time you could even try to implement it by yourself and create a PR. You could also help with other features (issues marked with `enhancement` or [projects](https://github.com/al34034/Qwant-Gnome-shell-integration/projects))
 Please note that some extra features may have there own branch (usually names `feature/[name]`), so check there before starting to do your own thing.
