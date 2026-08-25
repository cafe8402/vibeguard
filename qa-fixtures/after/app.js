export async function sendForm(data) {
  return fetch("https://approved.example/api", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
