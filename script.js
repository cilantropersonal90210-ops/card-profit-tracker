const addCardButton = document.getElementById("addCardButton");
const cardModal = document.getElementById("cardModal");
const closeModal = document.getElementById("closeModal");
const cardForm = document.getElementById("cardForm");

// Open modal
addCardButton.addEventListener("click", () => {
cardModal.classList.add("active");
});

// Close modal
closeModal.addEventListener("click", () => {
cardModal.classList.remove("active");
});

// Close modal if clicking outside it
cardModal.addEventListener("click", (event) => {
if (event.target === cardModal) {
cardModal.classList.remove("active");
}
});

// Add card
cardForm.addEventListener("submit", (event) => {
event.preventDefault();

const cardName = document.getElementById("cardName").value;
const buyPrice = document.getElementById("buyPrice").value;
const grading = document.getElementById("grading").value;

console.log({
cardName,
buyPrice,
grading
});

cardForm.reset();
cardModal.classList.remove("active");

alert("Card added!");
});
