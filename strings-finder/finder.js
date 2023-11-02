class Message {

    constructor (index=-1, location=null, line=-1, text=-1, module=null, context=-1, translated=false) {
        this.index = index;             // index of the message in the associated StringFinder messages list
        this.location = location;       // source file that contains the string
        this.line = line;               // line in the file where the string appears
        this.text = text;               // index of the source string in the strings list
        this.module = module;           // module name of the string
        this.context = context;         // index of the string context in the contexts list
        this.translated = translated;   // whether or not the string is translated
    }
}

class StringsFinder
{
    constructor(component, language='fr')
    {
        // the slicer component's name (ctk, 3d-slicer, slicerigt, ...)
        this.component = component;

        // the user's chosen language
        this.language = language;

        // list of detected contexts in the current component
        this.contextList = [];

        // stores a list of Message objects for any chosen language
        this.messageListByLanguage = {};

        // stores a list of Message objects grouped by module names
        this.messageListByModule = {};

        // store english strings (are the same for all languages)
        this.stringList = [];

        // store translated strings grouped by already chosen languages
        this.translatedStrings = {};

        // URL where ts files of the current component get downloaded
        this.downloadUrl = `https://challengehub.sn/get_ts_file.php?comp=${component}&lang=${language}`;

        // Weblate search URL for the current component
        this.weblateSearchUrl = `https://hosted.weblate.org/translate/3d-slicer/${component}/${language}/?q=`;

        // Weblate statistics URL for the current component
        this.weblateStatisticsUrl = `https://challengehub.sn/get-weblate-statistics.php?comp=${component}`;

        // whether or not the current TS file is completely downloaded
        // Used by the GUI loader to know when to show/hide the loader
        this.tsFileIsDownloaded = false;

        // whether or not original strings list is already initialized
        this.englishStringsAreAlreadyScanned = false;

        // store the supported languages list of the component
        this.languages = [];

        // whether or not the supported languages list is fully downloaded
        // Used by the GUI loader to know when to show/hide the loader
        this.languagesListIsDownloaded = false;
    }
    
    setLanguage(language)
    {
        if (this.language != language) {
            this.downloadUrl = this.downloadUrl.replace(`lang=${this.language}`, `lang=${language}`);
            this.weblateSearchUrl = this.weblateSearchUrl.replace(`/${this.language}/`, `/${language}/`);
            this.language = language;
        }
    }

    getText(index) {
        return this.stringList[index];
    }

    getContext(index) {
        return this.contextList[index];
    }

    // Returns the weblate search text of the given message
    getSearchText(message) {
        const messageText = this.getText(message.text);
        const messageContext = this.getContext(message.context);

        // replace potential HTML entities by their equivalent characters
        let searchText = messageText.includes('&') ? StringsFinder.htmlDecode(messageText) : messageText;
        const trimedSearchText = searchText.trim();

        if (!searchText.includes(' ') || !searchText.includes(':')) {
            if (trimedSearchText == searchText) {
                // exact match search
                searchText = `key:=${messageContext} AND source:="${searchText}"`;
            }
            else {
                // partial match search
                searchText = `key:=${messageContext} AND source:"${trimedSearchText}"`;
            }
        }
        else {
            // more generic search
            searchText = `${messageContext} "${trimedSearchText}"`;
        }

        return searchText;
    }

    // returns the input with HTML entities replaced by their equivalent characters
    static htmlDecode(html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        return doc.documentElement.textContent;
    }

    downloadTsFile(language='fr')
    {
        this.setLanguage(language);
        this.tsFileIsDownloaded = false;

        // if the language's TS file is already downloaded, we reuse the cached one
        if (this.messageListByLanguage.hasOwnProperty(this.language)) {
            this.tsFileIsDownloaded = true;
            return;
        }

        const xhr = new XMLHttpRequest();
        const finder = this;

        xhr.onload = function () {
            if (xhr.status != 200) {
                finder.messageListByLanguage[finder.language] = undefined;
                finder.translatedStrings[finder.language] = undefined;
                finder.tsFileIsDownloaded = true;
                return;
            }

            const xmlDoc = xhr.responseXML;
            let locations = xmlDoc.getElementsByTagName('location');

            finder.messageListByLanguage[finder.language] = [];
            finder.translatedStrings[finder.language] = [];
            
            let filename, message, storedMessage, contextName, contextIndex, isTranslated;
            let textIndex = 0, translationTag, messageText, newMessage;
            for (const location of locations) {
                filename = location.getAttribute('filename');
                // if (filename.indexOf('Modules/Loadable/') != -1 || filename.indexOf('Modules/Scripted/') != -1) {

                message = location.parentElement;
                translationTag = message.getElementsByTagName('translation')[0];

                // ignore vanished and obsolete strings
                if (['vanished', 'obsolete'].includes(translationTag.getAttribute('type'))) continue;

                finder.translatedStrings[finder.language].push(translationTag.innerHTML);
                isTranslated = (!translationTag.innerHTML || translationTag.hasAttribute('type')) ? false : true;
                contextName = message.parentElement.firstElementChild.innerHTML;
                messageText = message.getElementsByTagName('source')[0].innerHTML;

                if (!finder.englishStringsAreAlreadyScanned) {
                    finder.stringList.push(messageText);
                }

                contextIndex = finder.contextList.indexOf(contextName);

                if (contextIndex == -1) {
                    finder.contextList.push(contextName);
                    contextIndex = finder.contextList.length - 1;
                }

                newMessage = {
                    'index': finder.messageListByLanguage[finder.language].length,
                    'location': filename,
                    'line': location.getAttribute('line'),
                    'text': textIndex++,
                    'module': finder.getModuleName(filename),
                    'context': contextIndex,
                    'translated': {}
                };
                newMessage.translated[finder.language] = isTranslated;

                finder.messageListByLanguage[finder.language].push(newMessage);

                if (finder.messageListByModule.hasOwnProperty(newMessage.module)) {
                    storedMessage = finder.getMessageFromModuleList(newMessage);
                    if (storedMessage) {
                        storedMessage.translated[finder.language] = isTranslated;
                    }
                    else {
                        finder.messageListByModule[newMessage.module].push(newMessage);
                    }
                }
                else {
                    finder.messageListByModule[newMessage.module] = [newMessage];
                }
                // }
            };

            // the module list is updated only at first download
            // if (!moduleField.innerHTML) {
            //     udpateModuleListGui();
            // }
            finder.tsFileIsDownloaded = true;
            if (!finder.englishStringsAreAlreadyScanned) {
                finder.englishStringsAreAlreadyScanned = true;
            }
        }

        xhr.open('GET', `${finder.downloadUrl}`);
        xhr.send();

    }

    getModuleName(filename)
    {
        if (this.component != '3d-slicer') {
            return this.component;
        }

        let modulePatterns = ['Modules/Loadable/', 'Modules/CLI/', 'Modules/Scripted/']
        let index, moduleName = 'OTHERS';

        for (const modulePattern of modulePatterns) {
            if (filename.indexOf(modulePattern) != -1) {
                moduleName = filename.replace(modulePattern, '');

                if ((index = moduleName.indexOf('/')) != -1) {
                    moduleName = moduleName.substring(0, index);
                }

                return moduleName;
            }
        }

        return moduleName;
    }

    getMessageFromModuleList(searchedMessage) {
        for (const message of this.messageListByModule[searchedMessage.module]) {
            if (message.context == searchedMessage.context && message.text == searchedMessage.text
                && message.line == searchedMessage.line && message.location == searchedMessage.location) {
                return message;
            }
        }

        return null;
    }

    downloadLanguageList(callback) {
        const xhr = new XMLHttpRequest();
        const finder = this;
        xhr.onload = function () {
            const statitics = JSON.parse(xhr.responseText);

            for (const result of statitics.results) {
                finder.languages.push({
                    'code': result.code,
                    'name': result.name
                });
            }
            finder.languagesListIsDownloaded = true;
        }

        xhr.open('GET', finder.weblateStatisticsUrl);
        xhr.send();
    }
}

class StringsFinderManager
{
    constructor()
    {
        this.defaultLanguage = 'fr';
        this.components = [];
        // the core component should be the first in the list
        this.componentNames = ['3d-slicer', 'Ctk', 'SlicerIGT'];
        this.messageListByModule = undefined;
        this.messageListByLanguage = undefined;
    }

    init() {
        let index;
        for (const componentName of this.componentNames) {
            index = this.components.push(new StringsFinder(componentName))
            this.components[index-1].downloadTsFile(this.defaultLanguage);
        }

        this.components[0].downloadLanguageList();
    }

    addLanguage(language) {
        this.defaultLanguage = language;
        for (const component of this.components) {
            component.downloadTsFile(this.defaultLanguage);
        }
    }

    isReady() {
        if (!this.components[0].languagesListIsDownloaded) {
            return false;
        }

        for (const component of this.components) {
            if (!component.tsFileIsDownloaded) {
                return false;
            }
        }

        return true;
    }

    getLanguages() {
        return this.components[0].languages;
    }

    getModulesList() {
        const moduleList = []
        for (const component of this.components) {
            // if a translation exist for the component in the chosen language
            if (component.messageListByLanguage[this.defaultLanguage] !== undefined) {
                moduleList.push(component.messageListByModule);
            }
        }

        this.messageListByModule = Object.assign({}, ...moduleList);

        return this.messageListByModule;
    }

    getMessageCount() {
        let messageCount = 0;
        for (const component of this.components) {
            // if a translation exist for the component in the chosen language
            if (component.messageListByLanguage[this.defaultLanguage] !== undefined) {
                messageCount += component.messageListByLanguage[this.defaultLanguage].length;
            }
        }
        return messageCount;
    }

    getMessageDetails(stringId) {
        let [component, index] = stringId.split('|');
        let finder = this.getStringsFinderInstance(component);
        let message = finder.messageListByLanguage[this.defaultLanguage][index];
        const finderManager = this;
        return {
            'module': message.module,
            'key': finder.getContext(message.context),
            'location': `${message.location}:${message.line}`,
            'source': finder.getText(message.text),
            'translation': finder.translatedStrings[finderManager.defaultLanguage][message.text]
        };
    }

    getStringsFinderInstance(moduleName) {
        for (let i = 1; i < this.components.length; i++) {
            if (moduleName == this.components[i].component) {
                return this.components[i];
            }
        }
        return this.components[0];
    }

    // search strings in a weblate component
    // the StringFinder associated to any result is stored at the end of the found strings list
    searchComponentString(finder, searchedString, hideTranslated, moduleName) {
        const language = finder.language;
        let messageList = finder.messageListByLanguage[language];

        if (messageList === undefined) {
            return [];
        }
        
        if (moduleName) {
            messageList = finder.messageListByModule[moduleName];
        }
        searchedString = searchedString.toLowerCase();
        const foundMessages = [];
        for (const message of messageList) {
            if (message.translated[language] && hideTranslated) continue;
            if (finder.stringList[message.text].toLowerCase().includes(searchedString)
                || finder.translatedStrings[language][message.text].toLowerCase().includes(searchedString)) {
                foundMessages.push(message);
            }
        }

        if (foundMessages.length != 0) {
            foundMessages.push(finder);
        }

        return foundMessages;
    }

    // search strings in all components
    searchAllStrings(searchedString, moduleName, hideTranslated) {
        // if no module name is selected, only make search in untranslated strings
        if (moduleName == 'all' && searchedString == '' && !hideTranslated) {
            return null;
        }

        let foundMessages;
        if (moduleName != 'all') { // if a given module is chosen
            const finder = this.getStringsFinderInstance(moduleName);
            foundMessages = this.searchComponentString(finder, searchedString, hideTranslated, moduleName);
        }
        else {
            foundMessages = [];
            let messages;

            for (const component of this.components) {
                messages = this.searchComponentString(component, searchedString, hideTranslated);
                if (messages.length != 0) {
                    foundMessages.push(messages);
                }
            }

        }
        return foundMessages;
    }
}

class StringsFinderView
{
    constructor()
    {
        this.finderManager = new StringsFinderManager();
    }

    onPageLoad() {
        this.finderManager.init();

        this.languageList.onchange = () => this.onUserLanguageChanged();
        this.moduleField.onchange = () => this.onModuleNameChanged();
        this.searchField.oninput = () => this.onSearchFieldInputted();
        this.hideTranslatedCheckbox.onchange = () => this.onSearchFieldInputted();
        
        this.hideLoader(true);
    }

    hideLoader(isFirstCall, callback) {
        if (this.finderManager.isReady()) {
            this.loaderBox.hidden = true;
            this.generateModuleList();
            if (isFirstCall) {
                this.generateLanguageList(this.finderManager.getLanguages());
            }
            if (callback) {
                callback();
            }
        }
        else {
            setTimeout(() => this.hideLoader(isFirstCall, callback), 500);
        }
    }

    generateModuleList() {
        const messageListByModule = this.finderManager.getModulesList();
        const messageCount = this.finderManager.getMessageCount();
        let moduleNames = `<option value="all">All modules [${messageCount}]</option>`;

        const previousModule = this.moduleField.value;
        const moduleList = Object.keys(messageListByModule).sort();

        for (const moduleName of moduleList) {
            if (messageListByModule.hasOwnProperty(moduleName)) {
                moduleNames += `<option value="${moduleName}" ${moduleName == previousModule ? 'selected':''}>${moduleName} [${messageListByModule[moduleName].length}]</option>`;
            }
        }
        this.moduleField.innerHTML = moduleNames;
    }

    generateLanguageList(languages) {
        const currentLanguage = this.finderManager.defaultLanguage;

        let languageOptions = '';
        for (const language of languages) {
            languageOptions += `<option value="${language.code}" ${language.code == currentLanguage ? 'selected' : ''}>${language.name}</option>`;
        }

        this.languageList.innerHTML = languageOptions;
        this.searchField.select();
    }

    onUserLanguageChanged() {
        console.log('onUserLanguageChanged');
        this.loaderBox.hidden = false;
        const language = this.languageList.value;
        this.finderManager.addLanguage(language);

        // this.hideLoader(false);
        this.hideLoader(false, () => this.onSearchFieldInputted());
    }

    onModuleNameChanged() {
        this.onSearchFieldInputted();
        this.searchField.select();
    }

    onSearchFieldInputted() {
        const searchedString = this.searchField.value;
        const moduleName = this.moduleField.value;
        const hideTranslated = this.hideTranslatedCheckbox.checked;

        const foundMessages = this.finderManager.searchAllStrings(searchedString, moduleName, hideTranslated);
        this.showFoundStringsOnGui(foundMessages);
    }

    showFoundStringsOnGui(foundMessages) {
        const contentArea = this.stringTable.querySelector('tbody');

        this.foundStringBox.hidden = false;

        if (!foundMessages || foundMessages.length == 0) {
            this.stringTable.hidden = true;
            this.foundStringBox.hidden = foundMessages ? false : true;
            if (!this.foundStringBox.hidden) {
                this.foundStringBox.innerHTML = `Found strings : 0`;
            }
            return;
        }

        let stringListHTML, foundMessagesCount = 0;

        if (!Array.isArray(foundMessages[0])) {
            foundMessagesCount = foundMessages.length - 1;
            stringListHTML = this.generateResultItem(foundMessages);
        }
        else {
            stringListHTML = '';
            for (const foundMessage of foundMessages) {
                foundMessagesCount += foundMessage.length - 1;
                stringListHTML += this.generateResultItem(foundMessage);
            }
        }

        this.foundStringBox.innerHTML = `Found strings : ${foundMessagesCount}`;
        contentArea.innerHTML = stringListHTML;
        this.stringTable.hidden = false;
        this.addShowDetailEvents(contentArea);
    }

    generateResultItem(foundMessages) {
        const finder = foundMessages.pop();
        let codeHtml = '', messageText, searchText, searchByKeyText, contextString;

        for (const message of foundMessages) {
            messageText = finder.getText(message.text);
            contextString = finder.getContext(message.context);
            searchText = encodeURIComponent(finder.getSearchText(message));
            searchByKeyText = encodeURIComponent(`key:=${contextString}`);

            codeHtml += `
                <tr${message.translated[finder.language] ? ' class="translated"' : ''}>
                    <td>${message.module}</td>
                    <td>${messageText}</td>
                    <td>${message.translated[finder.language] ? '✅' : '❌'}</td>
                    <td>
                        <a href="${finder.weblateSearchUrl + searchByKeyText}" target="_blank"  title="Search this key in Weblate">
                            ${contextString}
                        </a>
                    </td>
                    <td>
                        <a href="#" stringId="${finder.component}|${message.index}">
                            <img src="detail-icon.png" title="Show details of this string.">
                        </a>
                    </td>
                    <td>
                        <a href="${finder.weblateSearchUrl + searchText}" target="_blank">
                            <img src="open-in-weblate.png" title="Translate this string on Weblate.">
                        </a>
                    </td>
                </tr>
            `;
        }

        return codeHtml;
    }

    showStringDetails(stringId) {
        let details = this.finderManager.getMessageDetails(stringId)
        this.detailBoxItems[0].innerHTML = details.module;
        this.detailBoxItems[1].innerHTML = details.key;
        this.detailBoxItems[2].innerHTML = details.source;
        this.detailBoxItems[3].innerHTML = details.translation;
        this.detailBoxItems[4].innerHTML = details.location;

        this.detailBox.hidden = false;
        this.detailBox.focus(); // so that it closes when the ESC key is typed
    }

    addShowDetailEvents(resultBoxElement) {
        const links = resultBoxElement.querySelectorAll('a[stringId]');

        for (const link of links) {
            link.onclick = () => {
                this.showStringDetails(link.getAttribute('stringId'));
                return false;
            }
        }
    }
}

window.onload = function () {
    const finderView = new StringsFinderView();

    finderView.loaderBox = document.getElementById('loaderBox');
    finderView.stringTable = document.getElementById('stringTable');
    finderView.foundStringBox = document.getElementById('foundStringBox');
    finderView.languageList = document.getElementById('languageList');
    finderView.moduleField = document.getElementById('moduleField');
    finderView.searchField = document.getElementById('searchField');
    finderView.detailBox = document.getElementById('detailBox');
    finderView.detailBoxItems = finderView.detailBox.getElementsByTagName('td');
    finderView.hideTranslatedCheckbox = document.getElementById('hideTranslatedCheckbox');

    finderView.onPageLoad();

    // deny form submission by ENTER key pressing
    const form = document.querySelector('form');
    form.onsubmit = function () {
        return false;
    }

    // Hide detailBox when typing ESCAPE key
    finderView.detailBox.onkeyup = function (e) {
        if (e.key == 'Escape') {
            this.hidden = true;
        }
    }
}