let cards = JSON.parse(localStorage.getItem("cards")) || [];
let currentTab = "unlisted";

console.log("NEW SCRIPT LOADED");

const addCardButton = document.getElementById("addCardButton");
const cardModal = document.getElementById("cardModal");
const closeModal = document.getElementById("closeModal");
const cardForm = document.getElementById("cardForm");

const unlistedTab = document.getElementById("unlistedTab");
const listedTab = document.getElementById("listedTab");

const soldTab = document.getElementById("soldTab");

const detailsModal = document.getElementById("detailsModal");
const closeDetailsModal = document.getElementById("closeDetailsModal");

closeDetailsModal.addEventListener("click", () => {
    detailsModal.classList.remove("active");
});

detailsModal.addEventListener("click", event => {
    if (event.target === detailsModal) {
        detailsModal.classList.remove("active");
    }
});

console.log("Unlisted button:", unlistedTab);
console.log("Listed button:", listedTab);

unlistedTab.addEventListener("click", () => {
    currentTab = "unlisted";

    unlistedTab.classList.add("active");
    listedTab.classList.remove("active");

    renderCards();
});

listedTab.addEventListener("click", () => {
    currentTab = "listed";

    listedTab.classList.add("active");
    unlistedTab.classList.remove("active");

    renderCards();
});

soldTab.addEventListener("click", () => {
    currentTab = "sold";

    soldTab.classList.add("active");
    unlistedTab.classList.remove("active");
    listedTab.classList.remove("active");

    renderCards();
});

function saveCards() {
    localStorage.setItem("cards", JSON.stringify(cards));
}

function updateDashboard() {
    const soldCards = cards.filter(card => card.status === "sold");
    const forSaleCards = cards.filter(card => card.status === "for-sale");

    document.getElementById("cardsTracked").textContent = cards.length;
    document.getElementById("cardsSold").textContent = soldCards.length;
    document.getElementById("cardsForSale").textContent = forSaleCards.length;

    let totalSpent = 0;
    let totalSales = 0;
    let soldCardCosts = 0;

    cards.forEach(card => {
        const buyPrice = Number(card.buyPrice) || 0;

        totalSpent += buyPrice;

        if (card.status === "sold") {
            const salePrice = Number(card.salePrice) || 0;
            const ebayFee = Number(card.ebayFee) || 0;
            const shippingCost = Number(card.shippingCost) || 0;

            const ebayFees = salePrice * ebayFee / 100;
            const orderFee = salePrice > 10 ? 0.40 : 0;

            totalSales += salePrice;

            soldCardCosts +=
                buyPrice +
                ebayFees +
                orderFee +
                shippingCost;
        }
    });

    const totalProfit = totalSales - soldCardCosts;

    document.getElementById("totalSpent").textContent =
        "$" + totalSpent.toFixed(2);

    document.getElementById("totalSales").textContent =
        "$" + totalSales.toFixed(2);

    document.getElementById("totalProfit").textContent =
        "$" + totalProfit.toFixed(2);
}

function renderCards() {
    const cardList = document.getElementById("cardList");

    const filteredCards = cards.filter(card => {
        if (currentTab === "unlisted") {
            return card.status === "unlisted";
        }

        if (currentTab === "listed") {
            return card.status === "listed";
        }

        if (currentTab === "sold") {
            return card.status === "sold";
        }

        return false;
    });

    if (filteredCards.length === 0) {
        cardList.innerHTML = `
            <div class="empty-message">
                <h3>No cards here</h3>
                <p>Add a card or move a card into this section.</p>
            </div>
        `;

        updateDashboard();
        return;
    }

    cardList.innerHTML = "";

    filteredCards.forEach(card => {
        const cardElement = document.createElement("div");

cardElement.className = "card-item";

cardElement.onclick = function(event) {
    if (event.target.tagName === "BUTTON") {
        return;
    }

    showCardDetails(card.id);
};

cardElement.innerHTML = `
    <h3>${card.name}</h3>

   <p>
    ${
        currentTab === "unlisted"
            ? "Date Added"
            : currentTab === "listed"
                ? "Date Listed"
                : "Date Sold"
    }:
    ${
        currentTab === "unlisted"
            ? (card.dateAdded || "N/A")
            : currentTab === "listed"
                ? (card.dateListed || "N/A")
                : (card.dateSold || "N/A")
    }
</p>

${
    currentTab === "sold"
        ? `
            <p>
                <strong>Sold for:</strong>
                $${Number(card.salePrice || 0).toFixed(2)}
            </p>
        `
        : ""
}

    ${
        currentTab === "unlisted"
            ? `
                <button onclick="listCard('${card.id}')">
                    List Card
                </button>
            `
            : ""
    }

    <button onclick="editCard('${card.id}')">
        Edit
    </button>

    <button onclick="deleteCard('${card.id}')">
        Delete
    </button>
`;

        cardList.appendChild(cardElement);
    });

    updateDashboard();
}

addCardButton.onclick = function () {
    cardModal.classList.add("active");
};

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

    const buyPrice = Number(
        document.getElementById("buyPrice").value
    );

    const grading = document.getElementById("grading").value;

    const newCard = {
        id: Date.now().toString(),
        name: name,
        buyPrice: buyPrice,
        grading: grading,
        status: "unlisted",
        dateAdded: new Date().toLocaleDateString(),
        salePrice: 0,
        shippingCost: 0
    };

    cards.push(newCard);

    saveCards();
    renderCards();

    cardForm.reset();
    cardModal.classList.remove("active");
});

function sellCard(id) {
    const salePrice = Number(
        prompt("Enter the sale price:")
    );

    const shippingCost = Number(
        prompt("Enter your actual shipping cost:")
    );

    if (
        isNaN(salePrice) ||
        salePrice < 0 ||
        isNaN(shippingCost) ||
        shippingCost < 0
    ) {
        alert("Please enter valid sale and shipping prices.");
        return;
    }

    const card = cards.find(card => card.id === id);

    if (!card) {
        return;
    }

    card.status = "sold";
    card.salePrice = salePrice;
    card.shippingCost = shippingCost;

    saveCards();
    renderCards();
}

function showCardDetails(id) {
    const card = cards.find(card => card.id === id);

    if (!card) {
        return;
    }

    const detailsModal = document.getElementById("detailsModal");
    const cardDetails = document.getElementById("cardDetails");

    cardDetails.innerHTML = `
        <h3>${card.name}</h3>

        <p>
            <strong>Buy Price:</strong>
            $${Number(card.buyPrice || 0).toFixed(2)}
        </p>

        <p>
            <strong>Worth Grading:</strong>
            ${card.grading}
        </p>

        <p>
            <strong>Date Added:</strong>
            ${card.dateAdded || "N/A"}
        </p>

        ${
            card.status === "listed" || card.status === "sold"
                ? `
                    <p>
                        <strong>Date Listed:</strong>
                        ${card.dateListed || "N/A"}
                    </p>
                `
                : ""
        }

        ${
            card.status === "sold"
                ? `
                    <p>
                        <strong>Date Sold:</strong>
                        ${card.dateSold || "N/A"}
                    </p>

                    <p>
                        <strong>Sold For:</strong>
                        $${Number(card.salePrice || 0).toFixed(2)}
                    </p>

                    <p>
                        <strong>Profit:</strong>
                        $${(
                            Number(card.salePrice || 0) -
                            Number(card.buyPrice || 0)
                        ).toFixed(2)}
                    </p>
                `
                : ""
        }

        <p>
            <strong>Status:</strong>
            ${card.status}
        </p>

        ${
            card.status === "listed"
                ? `
                    <button onclick="markCardSold('${card.id}')">
                        Mark as Sold
                    </button>
                `
                : ""
        }
    `;

    detailsModal.classList.add("active");
}

function markCardSold(id) {
    const card = cards.find(card => card.id === id);

    if (!card) {
        return;
    }

    const salePrice = Number(
        prompt("Enter the sale price:")
    );

    if (isNaN(salePrice) || salePrice < 0) {
        alert("Please enter a valid sale price.");
        return;
    }

    card.status = "sold";
    card.salePrice = salePrice;
    card.dateSold = new Date().toLocaleDateString();

    saveCards();
    detailsModal.classList.remove("active");
    renderCards();
    updateDashboard();
}

function listCard(id) {
    const card = cards.find(card => card.id === id);

    if (!card) {
        return;
    }

    card.status = "listed";
    card.dateListed = new Date().toLocaleDateString();

    saveCards();
    renderCards();
}

function editCard(id) {
    const card = cards.find(card => card.id === id);

    if (!card) {
        return;
    }

    const newName = prompt(
        "Card name:",
        card.name
    );

    if (newName === null) {
        return;
    }

    const newBuyPrice = prompt(
        "Buy price:",
        card.buyPrice
    );

    if (newBuyPrice === null) {
        return;
    }

    const newGrading = prompt(
        "Worth grading? (yes, maybe, or no):",
        card.grading
    );

    if (newGrading === null) {
        return;
    }

    card.name = newName.trim();
    card.buyPrice = Number(newBuyPrice);
    card.grading = newGrading.toLowerCase().trim();

    saveCards();
    renderCards();
}

function deleteCard(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this card?"
    );

    if (!confirmed) {
        return;
    }

    cards = cards.filter(card => card.id !== id);

    saveCards();
    renderCards();
}

renderCards();
