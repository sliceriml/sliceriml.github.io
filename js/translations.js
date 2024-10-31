function makeIconsAreaClickable() {
	let iconElement;
	const links = document.querySelectorAll('div.p-4 i + h5.mb-3 > a');

	for (const link of links) {
		iconElement = link.parentElement.previousElementSibling;
		iconElement.style.cursor = 'pointer';
		iconElement.onclick = (e) => {
			if (e.target.tagName != 'A') {
				link.click(e);
			}
		}
	}
}

makeIconsAreaClickable();