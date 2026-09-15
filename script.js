let cards = JSON.parse(localStorage.getItem("cards")) || [];

const addCardButton = document.getElementById("addCardButton");
const cardModal = document.getElementById("cardModal");
const closeModal = document.getElementById("closeModal");
const cardForm = document.getElementById("cardForm");

function saveCards() {
    localStorage.setItem("cards", JSON.stringify(cards));
}

function updateDashboard() {
    document.getElementById("cardsTracked").textContent = cards.length;

    const soldCards = cards.filter(card => card.status === "sold");
    const forSaleCards = cards.filter(card => card.status === "for-sale");

    document.getElementById("cardsSold").textContent = soldCards.length;
    document.getElementById("cardsForSale").textContent = forSaleCards.length;

    const totalProfit = soldCards.reduce((total, card) => {
        return total + (card.salePrice - card.buyPrice);
    }, 0);

    document.getElementById("totalProfit").textContent =
        `$${totalProfit.toFixed(2)}`;
}

function renderCards() {
    const cardList = document.getElementById("cardList");

    if (cards.length === 0) {
        cardList.innerHTML = `
            <div class="empty-message">
                <h3>No cards yet</h3>
                <p>Click "Add Card" to add your first card.</p>
            </div>
        `;

        updateDashboard();
        return;
    }

    cardList.innerHTML = "";

    cards.forEach(card => {
        const cardElement = document.createElement("div");

        cardElement.className = "card-item";

        cardElement.innerHTML = `
            <h3>${card.name}</h3>
            <p>Buy Price: $${card.buyPrice.toFixed(2)}</p>
            <p>Status: ${card.status === "sold" ? "Sold" : "For Sale"}</p>
            <p>Worth Grading: ${card.grading}</p>

            ${
                card.status === "sold"
                    ? `<p>Sale Price: $${card.salePrice.toFixed(2)}</p>
                       <p>Profit: $${(card.salePrice - card.buyPrice).toFixed(2)}</p>`
                    : `<button onclick="sellCard('${card.id}')">Mark as Sold</button>`
            }

            <button onclick="deleteCard('${card.id}')">Delete</button>
        `;

        cardList.appendChild(cardElement);
    });

    updateDashboard();
}

addCardButton.addEventListener("click", () => {
    cardModal.classList.add("active");
});

closeModal.addEventListener("click", () => {
    cardModal.classList.remove("active");
});

cardModal.addEventListener("click", event => {
    if (event.target === cardModal) {
        cardModal.classList.remove("active");
    }
});

cardForm.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("cardName").value.trim();
    const buyPrice = Number(document.getElementById("buyPrice").value);
    const grading = document.getElementById("grading").value;

    const newCard = {
        id: Date.now().toString(),
        name: name,
        buyPrice: buyPrice,
        grading: grading,
        status: "for-sale",
        salePrice: 0
    };

    cards.push(newCard);

    saveCards();
    renderCards();

    cardForm.reset();
    cardModal.classList.remove("active");
});

function sellCard(id) {
    const salePrice = Number(prompt("Enter the sale price:"));

    if (isNaN(salePrice) || salePrice < 0) {
        alert("Please enter a valid sale price.");
        return;
    }

    const card = cards.find(card => card.id === id);

    if (!card) {
        return;
    }

    card.status = "sold";
    card.salePrice = salePrice;

    saveCards();
    renderCards();
}

function deleteCard(id) {
    const confirmed = confirm("Are you sure you want to delete this card?");

    if (!confirmed) {
        return;
    }

    cards = cards.filter(card => card.id !== id);

    saveCards();
    renderCards();
}

renderCards();
