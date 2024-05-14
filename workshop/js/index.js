window.onload = function () {
	const main = document.querySelector('main');
	const nav = document.querySelector('nav');
	let currentItem = null;

	document.body.onscroll = function () {
		if (document.documentElement.scrollTop < 135) {
			nav.style.backgroundColor = 'rgba(0, 0, 0, 0)';
		}
		else
		{
			nav.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
		}
	}

	const menuItems = document.querySelectorAll('nav a');
	for (let i = 0; i < menuItems.length; i++) {
		menuItems[i].onclick = function (e) {
			e.preventDefault();
			// nav.style.backgroundColor = '#1B2738';
			nav.style.opacity = '1';

			if (currentItem != null) {
				currentItem.style.borderBottom = '';
			}
			
			currentItem = this;
			this.style.borderBottom = 'solid 5px #6a96d9';
			
			let xhr = new XMLHttpRequest();

			xhr.onload = function () {
				main.innerHTML = xhr.responseText;
				main.hidden = false;
				scroller.click();
				updateLinks(menuItems);
			}
			
			xhr.open('GET', this.href);
			xhr.send();
		}
	}

	if (window.location.href.includes('?download')) {
		menuItems[4].click();
	}
}

function updateLinks(menuItems) {
	const localLinks = document.querySelectorAll('#main a');
	for (const link of localLinks) {
		if (link.host == window.location.host && !link.href.endsWith('#')) {
			for (const menuItem of menuItems) {
				if (link.href == menuItem.href) {
					link.onclick = function (e) {
						e.preventDefault();
						menuItem.click();
					}
					break;
				}
			}
		}
	}
}