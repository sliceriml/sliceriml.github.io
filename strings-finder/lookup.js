const API_URL = 'https://challengehub.sn/get_ts_file.php';
// const API_URL = 'http://localhost/slicer-tools/lookup-table-full/get_ts_file.php';
let WEBLATE_SEARCH_URL = 'https://hosted.weblate.org/translate/3d-slicer/3d-slicer/fr/?q=';
// const WEBLATE_STATISTICS_URL = 'https://hosted.weblate.org/api/components/3d-slicer/3d-slicer/statistics/?format=json';
const WEBLATE_STATISTICS_URL = 'https://challengehub.sn/get-weblate-statistics.php';
// const WEBLATE_STATISTICS_URL = 'http://localhost/slicer-tools/lookup-table-full/get-weblate-statistics.php';

let contextList = [];
let messages = [];
let messageListByModule = {};

function downloadTsFile() {
	const xhr = new XMLHttpRequest();

	xhr.onload = function () {
		const xmlDoc = xhr.responseXML;
		let locations = xmlDoc.getElementsByTagName('location');

		let filename, message, contextName, contextIndex;

		for (const location of locations) {
			filename = location.getAttribute('filename');
			// if (filename.indexOf('Modules/Loadable/') != -1 || filename.indexOf('Modules/Scripted/') != -1) {

			message = location.parentElement;
			contextName = message.parentElement.firstElementChild.innerHTML;
			messageText = message.getElementsByTagName('source')[0].innerHTML

			contextIndex = contextList.indexOf(contextName);

			if (contextIndex == -1) {
				contextList.push(contextName);
				contextIndex = contextList.length - 1;
			}

			newMessage = {
				'location': filename,
				'line': location.getAttribute('line'),
				'text': messageText,
				'module': getModuleName(filename),
				'context': contextIndex
			};

			messages.push(newMessage);

			if (messageListByModule.hasOwnProperty(newMessage.module)) {
				messageListByModule[newMessage.module].push(newMessage);
			}
			else {
				messageListByModule[newMessage.module] = [newMessage];
			}
			// }
		};

		// console.log(contextList.length + " contexts detected\n\n");
		// console.log(contextList);
		// console.log('\n\n' + messages.length + " messages detected\n\n");
		// console.log(messages);
		udpateModuleListGui();
		// console.log("Done");
	}

	xhr.open('GET', API_URL);
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

function udpateModuleListGui() {
	let moduleNames = '<option value="none">Choose a module name</option>';
	moduleNames    += '<option value="all">All modules</option>';

	const moduleList = Object.keys(messageListByModule).sort()

	for (const moduleName of moduleList) {
		if (messageListByModule.hasOwnProperty(moduleName)) {
			moduleNames += `<option value="${moduleName}">${moduleName} [${messageListByModule[moduleName].length}]</option>`;
		}
	}
	const searchedModuleName = document.getElementById('moduleField');
	searchedModuleName.innerHTML = moduleNames;
}

function onModuleFieldChanged() {
	const moduleField = document.getElementById('moduleField');
	const searchField = document.getElementById('searchField');

	searchField.value = ''; // clear the search field
	searchField.focus();

	if (moduleField.value == 'all' || moduleField.value == 'none') {
		stringTable.hidden = true;
		return;
	}

	searchString(); // update the showed strings by making a new search
}

function searchString() {
	const searchField = document.getElementById('searchField');
	const moduleField = document.getElementById('moduleField');
	const searchedString = searchField.value.toLowerCase();
	const moduleName = moduleField.value;

	const foundMessages = [];
	let messageList = messages;

	if (moduleName == 'none') {
		moduleField.selectedIndex = 1; // select "all module" as the choice
	}
	else if (moduleName != 'all') { // if a given module is chosen
		messageList = messageListByModule[moduleName]
	}

	for (const message of messageList) {
		if (message.text.toLowerCase().indexOf(searchedString) != -1) {
			foundMessages.push(message);
		}
	}

	showFoundStringsOnGui(foundMessages);
}

function showFoundStringsOnGui(foundMessages) {
	const contentArea = document.querySelector('#stringTable tbody');

	if (foundMessages.length == 0) {
		stringTable.hidden = true;
		return;
	}

	let stringListHTML = '', messageText;

	for (const message of foundMessages) {
		// HTML entities are decoded before URI component encoding so that to avoid URL crash
		messageText = (message.text.indexOf('&') == -1) ? message.text : htmlDecode(message.text);

		stringListHTML += `
			<tr>
				<td>${message.module}</td>
				<td>${message.text}</td>
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
			languages += `<option value="${result.code}" ${result.code == 'fr' ? 'selected' : ''}>${result.name}</option>`
		}
		const languageList = document.getElementById('languageList');
		languageList.innerHTML = languages;
	}

	xhr.open('GET', WEBLATE_STATISTICS_URL);
	xhr.send();
}

let previousLanguage = 'fr';

function updateTranslationUrl() {
	const languageList = document.getElementById('languageList');
	const currentLanguage = languageList.value;

	WEBLATE_SEARCH_URL = WEBLATE_SEARCH_URL.replace(`/${previousLanguage}/`, `/${currentLanguage}/`);
	previousLanguage = currentLanguage;
	searchString();
}

window.onload = function () {
	getLanguageList();
	downloadTsFile();
	
	// Disable form submission when ENTER key is pressed
	const form = document.querySelector('form');
	form.onsubmit = function () {
		return false;
	};
}