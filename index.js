const ESC_KEY_CODE = 27;
const LEFT_KEY_CODE = 37;
const RIGHT_KEY_CODE = 39;

const APP_ROOT = 'http://localhost/afropixel/';

let images = [
	{
		"id": 1,
		"nom": "Femme noire",
		"prix": 25000,
		"categorie": "art",
		"url": "images/blackness.jpg"
	},
	{
		"id": 2,
		"nom": "Girls in Tech",
		"prix": 18000,
		"categorie": "technologie",
		"url": "images/deux.jpg"
	},
	{
		"id": 3,
		"nom": "Femme musulmane",
		"prix": 27500,
		"categorie": "religion",
		"url": "images/muslima.jpg"
	},
	{
		"id": 4,
		"nom": "Jigeen ci Tech",
		"prix": 20000,
		"categorie": "technologie",
		"url": "images/trois.jpg"
	},
	{
		"id": 5,
		"nom": "Les gadgets high tech",
		"prix": 19500,
		"categorie": "technologie",
		"url": "images/un.jpeg"
	},
	{
		"id": 6,
		"nom": "Centre de controle",
		"prix": 12500,
		"categorie": "papier peint",
		"url": "images/wallpaper-1.jfif"
	},
	{
		"id": 17,
		"nom": "Dark Army",
		"prix": 17000,
		"categorie": "papier peint",
		"url": "images/wallpaper-2.jpeg"
	},
	{
		"id": 20,
		"nom": "Champions d'Afrique",
		"prix": 22000,
		"categorie": "papier peint",
		"url": "images/wallpaper-3.jpg"
	},
	{
		"id": 21,
		"nom": "Bureau Mac OS",
		"prix": 12000,
		"categorie": "papier peint",
		"url": "images/wallpaper-4.png"
	},
	{
		"id": 22,
		"nom": "Bureau Mac OS bleu",
		"prix": 12000,
		"categorie": "papier peint",
		"url": "images/wallpaper-5.jpg"
	},
	{
		"id": 23,
		"nom": "Logo Ubuntu",
		"prix": 12000,
		"categorie": "papier peint",
		"url": "images/wallpaper-6.jpg"
	},
	{
		"id": 24,
		"nom": "Cyber Task Force",
		"prix": 12000,
		"categorie": "papier peint",
		"url": "images/wallpaper-7.jpg"
	},
	{
		"id": 25,
		"nom": "Regard profond",
		"prix": 17500,
		"categorie": "papier peint",
		"url": "images/wallpaper-8.jpg"
	},
	{
		"id": 26,
		"nom": "Administrateur",
		"prix": 12000,
		"categorie": "papier peint",
		"url": "images/wallpaper-9.jpg"
	},
	{
		"id": 7,
		"nom": "Cybercriminalité",
		"prix": 120012000,
		"categorie": "papier peint",
		"url": "images/wallpaper-10.jfif"
	}
];

// contient l'état du panier
let cart = {
	price   : 0,
	isEmpty : true,
	content : {},

	addItem(imageIndex) {
		this.isEmpty = false;
		this.content[imageIndex] = images[imageIndex];
		this.render();
	},

	removeItem(imageIndex) {
		delete(this.content[imageIndex]);
		this.isEmpty = Object.keys(this.content).length == 0 ? true : false;
		this.render();
	},

	toggle() {
		panier.hidden = !panier.hidden;
		// imageList.style.marginLeft = panier.hidden ? '0%' : '20%';
	},

	render() {
		let htmlCode = '<h1>Panier</h1>';
		if (this.isEmpty) {
			htmlCode += '<p>Le panier est vide</p>';
		}
		else {
			this.price = 0;
			htmlCode += '<ul>';
			for (const item of Object.values(this.content)) {
				this.price += item.prix;
				htmlCode += `<li>${item.nom}</li>`;
			}
			htmlCode += `</ul><h2>Total : ${this.price} FCA</h2><h3 onclick="showCommand()">Commander</h3>`;
		}
		panier.innerHTML = htmlCode;
		panier.hidden = false;
		// imageList.style.marginLeft = '20%';
	}
}

window.onload = function () {
	listerImages();
}

function listerImages() {
	let htmlCode = '';

	for (let i = 0; i < images.length; i++) {
		const image = images[i];
		htmlCode += `
			<div class="imageItem">
				<img src="${image.url}">
				<span>${image.nom}</span>
				<span class="prix">${image.prix} CFA</span>
				<span>
					<button 
						title="Ajouter cette image dans votre panier" 
						onclick="gererPanier('add', ${i})"
					>
						+
					</button>
					<!-- Unités -->
					<button 
						title="Retirer cette image de votre panier" 
						onclick="gererPanier('del', ${i})"
					>
						-
					</button>
				</span>
			</div>
		`;
	}

	imageList.innerHTML = htmlCode;
	// <div class="controls" onclick="this.parentElement.hidden = true">Fermer</div>
	popupImage.innerHTML = `
		<div class="controls">Fermer</div>
		<h1>${images[0].nom}</h1>
		<img src="${images[0].url}" id="monImage">
	`;

	addImageEvents();
}

let curseur = 0, listImages = null;

function addImageEvents () {
	listImages = document.querySelectorAll('#imageList img');

	for (let i = 0; i < listImages.length; i++) {
		listImages[i].onclick = function (e) {
			curseur = i;
			monImage.src = this.src;
			popupImage.hidden = false;
			monImage.previousElementSibling.innerHTML = images[curseur].nom; // titre
			popupImage.style.width = popupImage.style.height = '100%';
		}
	}

	document.onkeydown = function (e) {
		if (!popupImage.hidden) {
			switch (e.keyCode) {
				case ESC_KEY_CODE:
					popupImage.style.width = popupImage.style.height = '0%';
					setTimeout(() => {
						popupImage.hidden = true;
					}, 1000);
					break;
				case LEFT_KEY_CODE:
					defilement('previous');
					break;
				case RIGHT_KEY_CODE:
					defilement('next');
			}
		}
	}

	cartLogo.onclick = gererPanier;

	popupImage.onclick = function (e) {
		popupImage.style.width = popupImage.style.height = '0%';
		setTimeout(() => {
			popupImage.hidden = true;
		}, 1000);
	}
}

function defilement(sens = 'next') {
	if (sens === 'next') {
		curseur = (curseur == listImages.length - 1) ? 0 : ++curseur;
	}
	else {
		curseur = (curseur == 0) ? listImages.length - 1 : --curseur;
	}

	monImage.src = listImages[curseur].src;
	monImage.previousElementSibling.innerHTML = images[curseur].nom;
}

function gererPanier(action, imageIndex) {
	switch (action) {
		case 'add':
			cart.addItem(imageIndex);
			break;
		case 'del':
			cart.removeItem(imageIndex);
			break;
		default:
			cart.toggle();
	}
}

function showCommand() {
	let htmlCode = `
		<div class="controls" onclick="this.parentElement.hidden = true">Fermer</div>
		<h1>Produit(s) commandé(s)</h1>
		<table>
			<tr>
				<th>Nom</th>
				<th>Prix</th>
				<th>Catégorie</th>
				<th>Aperçu</th>
			</tr>
	`;

	for (const image of Object.values(cart.content)) {
		htmlCode += `
			<tr>
				<td>${image.nom}</td>
				<td>${image.prix}</td>
				<td>${image.categorie}</td>
				<td><img src="${image.url}" height="100" width="100"></td>
			</tr>
		`;
	}
	htmlCode += `<tr><th colspan="4">Prix Total : ${cart.price} FCFA</th></tr></table>`;
	commandBox.innerHTML = htmlCode.replace(/[\t\n]/g, '');
	commandBox.hidden = false;
	commandBox.style.width = commandBox.style.height = '100%';
}