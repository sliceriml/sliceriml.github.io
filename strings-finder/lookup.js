const TS_FILE_DOWNLOAD_URL = 'https://challengehub.sn/get_ts_file.php';
// const API_URL = 'http://localhost/slicer-tools/lookup-table-full/get_ts_file.php';
let WEBLATE_SEARCH_URL = 'https://hosted.weblate.org/translate/3d-slicer/3d-slicer/fr/?q=';
// const WEBLATE_STATISTICS_URL = 'https://hosted.weblate.org/api/components/3d-slicer/3d-slicer/statistics/?format=json';
const WEBLATE_STATISTICS_URL = 'https://challengehub.sn/get-weblate-statistics.php';
// const WEBLATE_STATISTICS_URL = 'http://localhost/slicer-tools/lookup-table-full/get-weblate-statistics.php';

let contextList = [];
const messageListByLanguage = {};
let messageListByModule = {};
const stringList = []; // store english strings (are the same for all languages)
const translatedStrings = {}; // store translated strings for each language)

let userLanguage = 'fr'; // default user language

let tsFileIsDownloaded = false;
let languagesListIsDownloaded = false;
let englishStringsAreAlreadyScanned = false; // to know whether or not

function downloadTsFile() {
	// if the language's TS file is already downloaded, we reuse the cached one
	if (messageListByLanguage.hasOwnProperty(userLanguage)) {
		tsFileIsDownloaded = true;
		return;
	}

	const xhr = new XMLHttpRequest();

	xhr.onload = function () {
		const xmlDoc = xhr.responseXML;
		let locations = xmlDoc.getElementsByTagName('location');

		messageListByLanguage[userLanguage] = [];
		translatedStrings[userLanguage] = [];
		let filename, message, storedMessage, contextName, contextIndex, isTranslated;

		let textIndex = 0;
		for (const location of locations) {
			filename = location.getAttribute('filename');
			// if (filename.indexOf('Modules/Loadable/') != -1 || filename.indexOf('Modules/Scripted/') != -1) {

			message = location.parentElement;
			translationTag = message.getElementsByTagName('translation')[0];

			// ignore vanished and obsolete strings
			if (['vanished', 'obsolete'].includes(translationTag.getAttribute('type'))) continue;

			translatedStrings[userLanguage].push(translationTag.innerHTML);
			isTranslated = (!translationTag.innerHTML || translationTag.hasAttribute('type')) ? false : true;
			contextName = message.parentElement.firstElementChild.innerHTML;
			messageText = message.getElementsByTagName('source')[0].innerHTML;

			if (!englishStringsAreAlreadyScanned) {
				stringList.push(messageText);
			}


			contextIndex = contextList.indexOf(contextName);

			if (contextIndex == -1) {
				contextList.push(contextName);
				contextIndex = contextList.length - 1;
			}

			newMessage = {
				'location': filename,
				'line': location.getAttribute('line'),
				'text': textIndex++,
				'module': getModuleName(filename),
				'context': contextIndex,
				'translated': {}
			};
			newMessage.translated[userLanguage] = isTranslated;

			messageListByLanguage[userLanguage].push(newMessage);

			if (messageListByModule.hasOwnProperty(newMessage.module)) {
				storedMessage = getMessageFromModuleList(newMessage);
				if (storedMessage) {
					storedMessage.translated[userLanguage] = isTranslated;
				}
				else {
					messageListByModule[newMessage.module].push(newMessage);
				}
			}
			else {
				messageListByModule[newMessage.module] = [newMessage];
			}
			// }
		};

		// the module list is updated only at first download
		if (!moduleField.innerHTML) {
			udpateModuleListGui();
		}
		tsFileIsDownloaded = true;
		if (!englishStringsAreAlreadyScanned) {
			englishStringsAreAlreadyScanned = true;
		}
	}

	xhr.open('GET', `${TS_FILE_DOWNLOAD_URL}?lang=${userLanguage}`);
	xhr.send();
}

function getModuleName(filename) {
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

function getMessageFromModuleList(searchedMessage) {
	for (const message of messageListByModule[searchedMessage.module]) {
		if (message.context == searchedMessage.context && message.text == searchedMessage.text
			&& message.line == searchedMessage.line && message.location == searchedMessage.location) {
			return message;
		}
	}

	return null;
}

function udpateModuleListGui() {
	let moduleNames = `<option value="all">All modules [${messageListByLanguage[userLanguage].length}]</option>`;

	const moduleList = Object.keys(messageListByModule).sort()

	for (const moduleName of moduleList) {
		if (messageListByModule.hasOwnProperty(moduleName)) {
			moduleNames += `<option value="${moduleName}">${moduleName} [${messageListByModule[moduleName].length}]</option>`;
		}
	}
	const searchedModuleName = document.getElementById('moduleField');
	searchedModuleName.innerHTML = moduleNames;
}

function onModuleNameChanged() {
	const moduleField = document.getElementById('moduleField');
	const searchField = document.getElementById('searchField');

	searchField.value = ''; // clear the search field
	searchField.focus();

	searchString(); // update the showed strings by making a new search
}

function searchString() {
	const searchField = document.getElementById('searchField');
	const moduleField = document.getElementById('moduleField');
	const searchedString = searchField.value.toLowerCase();
	const moduleName = moduleField.value;

	if (moduleName == 'all' && searchedString == '' && !hideTranslatedCheckbox.checked) {
		stringTable.hidden = true;
		foundStringBox.hidden = true;
		return;
	}

	const foundMessages = [];
	// let messageList = messages;
	let messageList = messageListByLanguage[userLanguage];

	if (moduleName != 'all') { // if a given module is chosen
		messageList = messageListByModule[moduleName]
	}

	for (const message of messageList) {
		if (message.translated[userLanguage] && hideTranslatedCheckbox.checked) continue;
		if (stringList[message.text].toLowerCase().indexOf(searchedString) != -1
			|| translatedStrings[userLanguage][message.text].toLowerCase().indexOf(searchedString) != -1) {
			foundMessages.push(message);
		}
	}

	showFoundStringsOnGui(foundMessages);
}

function showFoundStringsOnGui(foundMessages) {
	const contentArea = document.querySelector('#stringTable tbody');

	foundStringBox.hidden = false;
	foundStringBox.innerHTML = `Found strings : ${foundMessages.length}`;

	if (foundMessages.length == 0) {
		stringTable.hidden = true;
		return;
	}

	let stringListHTML = '', messageText;

	for (const message of foundMessages) {
		// HTML entities are decoded before URI component encoding so that to avoid URL crash
		messageText = stringList[message.text];
		messageText = (messageText.indexOf('&') == -1) ? messageText : htmlDecode(messageText);

		stringListHTML += `
			<tr${message.translated[userLanguage] ? ' class="translated"':''}>
				<td>${message.module}</td>
				<td>${stringList[message.text]}</td>
				<td>${message.translated[userLanguage] ? '✅' : '❌'}</td>
				<td>${contextList[message.context]}</td>
				<td>
					<a href="${WEBLATE_SEARCH_URL}${encodeURIComponent(contextList[message.context] + ' "' + messageText + '"')}" target="_blank">Open on weblate</a>
				</td>
			</tr>
		`;
	}

	contentArea.innerHTML = stringListHTML;
	stringTable.hidden = false;
}

function htmlDecode(input) {
	var doc = new DOMParser().parseFromString(input, "text/html");
	return doc.documentElement.textContent;
}

function getLanguageList() {
	const xhr = new XMLHttpRequest();

	xhr.onload = function () {
		let languages = '';
		const statitics = JSON.parse(xhr.responseText);

		for (const result of statitics.results) {
			languages += `<option value="${result.code}" ${result.code == userLanguage ? 'selected' : ''}>${result.name}</option>`
		}
		const languageList = document.getElementById('languageList');
		languageList.innerHTML = languages;
		languagesListIsDownloaded = true;
	}

	xhr.open('GET', WEBLATE_STATISTICS_URL);
	xhr.send();
}

let previousLanguage = 'fr';

function onUserLanguageChanged() {
	const languageList = document.getElementById('languageList');
	userLanguage = languageList.value;

	// update search URL to the new language
	WEBLATE_SEARCH_URL = WEBLATE_SEARCH_URL.replace(`/${previousLanguage}/`, `/${userLanguage}/`);
	previousLanguage = userLanguage;

	// download the language specific TS file
	tsFileIsDownloaded = false;
	loaderBox.hidden = false;
	downloadTsFile();

	// hide the loader and update the result table with a new search
	hideLoader(searchString);
}

function hideLoader(callback) {
	if (tsFileIsDownloaded && languagesListIsDownloaded) {
		loaderBox.hidden = true;
		if (callback) {
			callback();
		}
	}
	else {
		setTimeout(hideLoader, 500, callback);
	}
}

window.onload = function () {
	getLanguageList();
	downloadTsFile();
	
	// Disable form submission when ENTER key is pressed
	const form = document.querySelector('form');
	form.onsubmit = function () {
		return false;
	};

	// Hide the loader as soon as all resources are downloaded
	hideLoader();
}