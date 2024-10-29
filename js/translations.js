function makeIconsAreaClickable() {
	let parent;
	const links = document.querySelectorAll('div.p-4 i + h5.mb-3 > a');

	for (const link of links) {
		parent = link.parentElement.parentElement.parentElement.parentElement;
		parent.onclick = () => link.click();
		parent.style.cursor = 'pointer';
	}
}

makeIconsAreaClickable();