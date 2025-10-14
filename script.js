document.addEventListener('DOMContentLoaded', function () {
	let venuesSection = document.getElementById('venues');
	if (venuesSection) {
		let searchInput = document.createElement('input');
		searchInput.type = 'text';
		searchInput.placeholder = 'Search venues...';
		searchInput.setAttribute('aria-label', 'Search venues');
		searchInput.style.marginBottom = '1em';
		venuesSection.insertBefore(searchInput, venuesSection.querySelector('.venue-list'));
		searchInput.addEventListener('input', function () {
			let query = searchInput.value.toLowerCase();
			let cards = venuesSection.querySelectorAll('.venue-list li');
			cards.forEach(card => {
				let name = card.querySelector('h3')?.textContent.toLowerCase() || '';
				let desc = card.querySelector('p')?.textContent.toLowerCase() || '';
				if (name.includes(query) || desc.includes(query)) {
					card.style.display = '';
				} else {
					card.style.display = 'none';
				}
			});
		});
	}

	const reviewForm = document.querySelector('#review-form form');
	if (reviewForm) {
		reviewForm.addEventListener('submit', function (e) {
			e.preventDefault();
			const rating = reviewForm.querySelector('input[name="rating"]:checked');
			if (!rating || Number(rating.value) < 1 || Number(rating.value) > 5) {
				let errorMsg = document.createElement('div');
				errorMsg.textContent = 'Please select a rating between 1 and 5 stars.';
				errorMsg.style.background = '#ffe6e6';
				errorMsg.style.color = '#a50000';
				errorMsg.style.padding = '1em';
				errorMsg.style.marginTop = '1em';
				errorMsg.style.borderRadius = '8px';
				errorMsg.setAttribute('role', 'alert');
				reviewForm.parentNode.insertBefore(errorMsg, reviewForm.nextSibling);
				setTimeout(() => {
					if (errorMsg.parentNode) errorMsg.parentNode.removeChild(errorMsg);
				}, 3000);
				return;
			}
			let thankYou = document.createElement('div');
			thankYou.textContent = 'Thank you for your review!';
			thankYou.style.background = '#e6ffe6';
			thankYou.style.color = '#0055a5';
			thankYou.style.padding = '1em';
			thankYou.style.marginTop = '1em';
			thankYou.style.borderRadius = '8px';
			thankYou.setAttribute('role', 'status');
			reviewForm.parentNode.insertBefore(thankYou, reviewForm.nextSibling);
			reviewForm.reset();
			setTimeout(() => {
				if (thankYou.parentNode) thankYou.parentNode.removeChild(thankYou);
			}, 3000);
		});
	}
});
document.addEventListener('DOMContentLoaded', function () {
	const browseSection = document.getElementById('venues');
	const menuSection = document.getElementById('venue-menu');
	const reviewSection = document.getElementById('review-form');

    function showSection(section) {
		[browseSection, menuSection, reviewSection].forEach(s => {
			if (s) s.style.display = 'none';
		});
		if (section) section.style.display = 'block';
	}
	const navBrowse = document.querySelector('a[href="#venues"], button[data-section="browse"]');
	const navMenu = document.querySelector('a[href="#venue-menu"], button[data-section="menu"]');
	const navReview = document.querySelector('a[href="#review-form"], button[data-section="review"]');

	if (navBrowse) {
		navBrowse.addEventListener('click', function (e) {
			e.preventDefault();
			showSection(browseSection);
		});
	}
	if (navMenu) {
		navMenu.addEventListener('click', function (e) {
			e.preventDefault();
			showSection(menuSection);
		});
	}
	if (navReview) {
		navReview.addEventListener('click', function (e) {
			e.preventDefault();
			showSection(reviewSection);
		});
	}
	showSection(browseSection);
});
