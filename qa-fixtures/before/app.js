const token = "demo_token_value_for_testing_only";
const adminRole = "admin";

export async function sendForm(data) {
  return fetch("http://outside.example/api", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
