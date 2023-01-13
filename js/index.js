const borderColors = ['#6a96d9', '#3a9d56', '#db4141', '#fda843', '#e1da2f'];

window.onload = function () {
	const main = document.querySelector('main');
	const nav = document.querySelector('nav');
	let currentItem = null;
	// main.hidden = true;

	document.body.onscroll = function () {
		if (document.documentElement.scrollTop < 135) {
			nav.style.backgroundColor = 'rgba(0, 0, 0, 0)';
			// nav.style.opacity = '0';
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
			}
			
			xhr.open('GET', this.href);
			xhr.send();
		}
	}
}