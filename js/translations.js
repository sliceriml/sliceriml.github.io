function makeIconsAreaClickable() {
	let iconElement;
	const links = document.querySelectorAll('div.p-4 > p.version-box > a:first-of-type');

	for (const link of links) {
		iconElement = link.parentElement.parentElement.firstElementChild;
		iconElement.style.cursor = 'pointer';
		iconElement.onclick = (e) => {
			if (e.target.tagName != 'A') {
				link.click(e);
			}
		}
	}
}

makeIconsAreaClickable();