export async function initGameController() {
  console.log("GameController initialisé !");

  const response = await fetch("http://localhost:3000/api/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "fields name, rating; limit 10;" })
  });

  if (!response.ok) {
    console.error('Erreur API:', await response.text());
    return;
  }

  const games = await response.json();
  console.log(games);
}
