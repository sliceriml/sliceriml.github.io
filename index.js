const bgColors = ['#6a96d9', '#3a9d56', '#db4141', '#fda843', '#e1da2f'];
// const bgColors = ['#6495ed', '#2e8b57', '#cd5c5c', '#f4a460', '#e1b12f'];

window.onload = function () {
	const menuItems = document.querySelectorAll('nav li a');

	for (let i = 0; i < bgColors.length; i++) {
		menuItems[i].style.backgroundColor = bgColors[i];
		menuItems[i].onclick = function () {
			const titre = document.querySelector('main h1:first-child');
			titre.innerHTML = this.innerHTML;
			borderTopLeft.style.borderColor = borderBottomRight.style.borderColor = bgColors[i];
		}
		// borderTopLeft.style.height = borderBottomRight.style.height = borderTopLeft.style.width;
		// borderBottomRight.style.height = borderBottomRight.style.
	}
}