let previousLanguage = 'fr';

function updateLinks() {
	let currentLanguage = languages.value;
	let links = document.getElementsByTagName('a');

	for (let link of links) {
		link.href = link.href.replace(`/${previousLanguage}/`, `/${currentLanguage}/`);
	}
	previousLanguage = currentLanguage;
}

function filterByModuleName() {
	let searchedModule = searchedModuleName.value.toLowerCase();
	let modulesNames = document.querySelectorAll('td:nth-child(1)')

	for(let moduleName of modulesNames) {
		if (moduleName.innerText.toLowerCase().indexOf(searchedModule) != -1) {
			moduleName.parentElement.hidden = false;
		}
		else {
			moduleName.parentElement.hidden = true;
		}
	}
}

function filterByModuleSubcategory() {
	let searchedModule = searchedSubcategory.value.toLowerCase();
	filterByTableIndex(2, searchedModule);
}

function filterByModuleLevel() {
	let searchedModules = level1.checked ? ['*'] : [];
	searchedModules = searchedModules.concat(level2.checked ? ['**'] : []);
	searchedModules = searchedModules.concat(level3.checked ? ['***'] : []);

	if (searchedModules.length != 0) {
		filterByTableIndex(3, searchedModules);
	}
	else {
		filterByTableIndex(3, ['*', '**', '***']);
	}
}

function filterByTableIndex(tableIndex, searchedModule) {
	const selector = `td:nth-child(${tableIndex})`;
	let modulesItems = document.querySelectorAll(selector)

	for(let moduleItem of modulesItems) {
		if (typeof(searchedModule) === 'string') {
			if (moduleItem.innerText.toLowerCase().indexOf(searchedModule) != -1) {
				moduleItem.parentElement.hidden = false;
			}
			else {
				moduleItem.parentElement.hidden = true;
			}
		}
		else // in case searchedModule is an array of strings (for difficulty levels)
		{
			if (searchedModule.indexOf(moduleItem.innerText.toLowerCase()) != -1) {
				moduleItem.parentElement.hidden = false;
			}
			else {
				moduleItem.parentElement.hidden = true;
			}
		}
	}
}